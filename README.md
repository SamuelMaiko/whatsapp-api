# MOSI Framework Architecture & API Specification
**The Definitive Architecture, Public Contracts, and Implementation Blueprint for an Odoo-Inspired TypeScript/React/Firestore Engine**

*Document Version: 3.0 (Master Architectural Contract)*  
*Target System: MOSI Extensible Application Platform*  
*Reference Source: Local Odoo 18.0 Community & Enterprise Codebase (`/home/elwan_x/Odoo/odoo-18.0`)*

---

## 1. Monorepo Architecture & Workspace Standards

Mosi is structured as a **`pnpm` workspace** to enforce strict dependency isolation, deterministic package resolution, and rapid incremental builds.

### 1.1 Repository Layout
```
mosi/
├── apps/
│   └── web/                         # React Web Client host & development playground
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
├── packages/
│   ├── kernel/                      # Minimal Bootstrap Engine: config, discovery, DAG, registry pool
│   │   ├── package.json
│   │   └── src/
│   ├── view-engine/                 # Typed View AST builders, semantic selectors, structural transforms
│   │   ├── package.json
│   │   └── src/
│   ├── model-engine/                # Logical models, field descriptors, Zod schema generation
│   │   ├── package.json
│   │   └── src/
│   ├── data-api/                    # StorageAdapter contract, mock provider, repository interfaces
│   │   ├── package.json
│   │   └── src/
│   ├── migration-engine/            # Tenant Firestore batch migration runner & checkpoint manager
│   │   ├── package.json
│   │   └── src/
│   └── cli/                         # Developer CLI (`mosi dev`, `mosi addon ...`, `mosi debug ...`)
│       ├── package.json
│       └── src/
├── addons/
│   ├── mosi_base/                   # Foundational addon: BaseModel, standard fields, actions, menus
│   ├── mosi_web/                    # Foundational addon: React renderers, UI component registry
│   ├── mosi_firebase/               # Foundational addon: Real Firebase Firestore/Auth adapter
│   ├── library/                     # Base PoC domain addon (books, authors, standard form/list)
│   └── library_custom/              # PoC extension addon (ISBN, Print button, save middleware)
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json               # Shared strict TypeScript configuration
├── eslint.config.mjs                # Unified linting rules
└── mosi.config.ts                   # Platform discovery and runtime configuration
```

### 1.2 Monorepo Configuration Contracts

#### `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'addons/*'
```

#### `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## 2. Public API Specifications

### 2.1 Addon Manifest Contract (`manifest.ts`)
Each addon in a configured addons path must export a validated manifest.

```typescript
export interface AddonDependency {
  id: string;
  version?: string; // SemVer range (e.g. ">=1.0.0 <2.0.0")
}

export interface FirestoreIndexField {
  fieldPath: string;
  order?: 'ASCENDING' | 'DESCENDING';
  arrayConfig?: 'CONTAINS';
}

export interface FirestoreIndexRequirement {
  collectionGroup: string;
  queryScope?: 'COLLECTION' | 'COLLECTION_GROUP';
  fields: FirestoreIndexField[];
}

export interface MosiManifest {
  /** Unique technical identifier matching the directory name */
  id: string;
  /** Human-readable display name */
  name: string;
  /** SemVer version string (e.g. "1.2.0") */
  version: string;
  /** Short summary of addon purpose */
  summary?: string;
  /** Comprehensive markdown description */
  description?: string;
  /** Technical author or maintainer */
  author?: string;
  /** License identifier (e.g. "LGPL-3.0", "MIT", "Proprietary") */
  license?: string;
  /** Direct dependencies required prior to loading this addon */
  depends: (string | AddonDependency)[];
  /** Whether this addon can be installed directly by users (default: true) */
  installable?: boolean;
  /** If true, automatically installed when all dependencies are installed */
  autoInstall?: boolean | string[];
  /** Entry point file relative to addon root */
  entry?: string;
  /** Required Firestore composite indexes that tenant must deploy */
  indexes?: FirestoreIndexRequirement[];
  /** Relative path to Firestore security rules fragment (e.g. "./rules.firestore") */
  securityRules?: string;
  /** Category grouping for the Apps interface */
  category?: string;
}
```

#### Manifest Example (`addons/library_custom/manifest.ts`):
```typescript
import { defineManifest } from '@mosi/kernel';

export default defineManifest({
  id: 'library_custom',
  name: 'Library Barcode & Advanced Customizations',
  version: '1.1.0',
  summary: 'Adds ISBN barcode tracking and print action to library books',
  author: 'Unknown',
  license: 'LGPL-3.0',
  depends: ['library', 'mosi_web'],
  indexes: [
    {
      collectionGroup: 'library_books',
      fields: [
        { fieldPath: 'author_id', order: 'ASCENDING' },
        { fieldPath: 'isbn', order: 'ASCENDING' }
      ]
    }
  ],
  securityRules: './rules.firestore'
});
```

---

### 2.2 Model and Field API (`@mosi/model-engine`)

Mosi models are logical domain entities. They define schema validation, computed fields, relational references, and lifecycle hooks while decoupling from low-level storage.

#### Core Field Types:
* `fields.char(options)`: Single-line string with max length and sanitization.
* `fields.text(options)`: Multi-line text.
* `fields.integer(options)` / `fields.float(options)`: Numeric fields with min/max and precision.
* `fields.boolean(options)`: Boolean flag with default.
* `fields.date(options)` / `fields.datetime(options)`: ISO-8601 date and timestamp.
* `fields.selection(choices, options)`: Enum selection mapped to string labels.
* `fields.many2one(targetModel, options)`: Document reference storing the foreign record ID.
* `fields.one2many(targetModel, inverseField, options)`: Virtual inverse collection query.

#### Base Model Definition (`addons/library/src/models/book.ts`):
```typescript
import { defineModel, fields } from '@mosi/model-engine';

export const Book = defineModel({
  name: 'library.book',
  description: 'Library Book Record',
  fields: {
    title: fields.char({
      string: 'Title',
      required: true,
      index: true,
      help: 'Official book title'
    }),
    author: fields.char({
      string: 'Author',
      required: true,
      index: true
    }),
    state: fields.selection([
      ['draft', 'Draft'],
      ['available', 'Available in Shelf'],
      ['borrowed', 'Checked Out'],
      ['lost', 'Lost']
    ], {
      string: 'Status',
      default: 'draft',
      index: true
    }),
    borrowCount: fields.integer({
      string: 'Borrow Count',
      default: 0
    })
  },
  
  methods: {
    async action_save(record, env) {
      env.logger.info(`Persisting book: ${record.title}`);
      return await env.data.save('library.book', record);
    },
    
    async action_borrow(record, env) {
      if (record.state !== 'available') {
        throw new Error('Only available books can be borrowed.');
      }
      return await env.data.update('library.book', record.id, {
        state: 'borrowed',
        borrowCount: (record.borrowCount || 0) + 1
      });
    }
  }
});
```

#### Model Extension API (`addons/library_custom/src/models/book_extension.ts`):
In `library_custom`, an addon extends `library.book` without modifying `library`:
```typescript
import { extendModel, fields } from '@mosi/model-engine';

export const BookExtension = extendModel({
  name: 'library.book', // In-place extension target
  addon: 'library_custom',
  
  // Injects new fields or overrides existing field attributes
  fields: {
    isbn: fields.char({
      string: 'ISBN-13',
      required: false,
      help: 'Standard International Standard Book Number'
    }),
    // Override existing field label and make it non-editable when borrowed
    author: fields.char({
      string: 'Primary Author / Creator'
    })
  }
});
```

---

### 2.3 Typed View Definition & Structural Inheritance API (`@mosi/view-engine`)

Views are compiled from structured, typed Abstract Syntax Trees.

#### View Node Schema:
Every node in the AST has a deterministic identifier, a tag type, attributes, and children:
```typescript
export type ViewNodeTag = 
  | 'view' 
  | 'header' 
  | 'body' 
  | 'section' 
  | 'group' 
  | 'field' 
  | 'button' 
  | 'custom';

export interface BaseViewNode {
  id?: string;
  tag: ViewNodeTag;
  attributes?: Record<string, any>;
  children?: ViewNode[];
}

export interface FieldNode extends BaseViewNode {
  tag: 'field';
  name: string;
  widget?: string;
  readonly?: boolean;
  required?: boolean;
  placeholder?: string;
  options?: Record<string, any>;
}

export interface ButtonNode extends BaseViewNode {
  tag: 'button';
  name: string;
  string: string;
  type: 'object' | 'action';
  class?: string;
  icon?: string;
  confirm?: string;
  invisible?: string | boolean;
}
```

#### Base View Builder (`addons/library/src/views/book_form.ts`):
```typescript
import { defineFormView, field, button, group, section } from '@mosi/view-engine';

export const bookFormView = defineFormView({
  id: 'library.book_form_view',
  model: 'library.book',
  title: 'Book Record',
  arch: {
    header: [
      button({
        name: 'action_save',
        string: 'Save',
        type: 'object',
        class: 'btn-primary'
      }),
      button({
        name: 'action_discard',
        string: 'Discard',
        type: 'action',
        class: 'btn-secondary'
      })
    ],
    body: [
      section({
        id: 'main_details',
        children: [
          group({
            id: 'general_info',
            children: [
              field('title', { placeholder: 'Enter book title', required: true }),
              field('author', { placeholder: 'Author name', required: true })
            ]
          })
        ]
      })
    ]
  }
});
```

#### Structural Extension Builder (`addons/library_custom/src/views/book_form_extension.ts`):
```typescript
import { extendView, field, button } from '@mosi/view-engine';

export const bookFormExtension = extendView({
  id: 'library_custom.book_form_view_extension',
  targetView: 'library.book_form_view',
  addon: 'library_custom',
  priority: 16,
  operations: [
    // 1. Insert ISBN field immediately after Title
    {
      target: "field[name='title']",
      position: 'after',
      node: field('isbn', { placeholder: 'e.g. 978-3-16-148410-0' })
    },
    // 2. Add a Print Barcode button immediately after Save
    {
      target: "button[name='action_save']",
      position: 'after',
      node: button({
        name: 'action_print',
        string: 'Print Barcode',
        type: 'object',
        class: 'btn-outline-primary',
        icon: 'printer'
      })
    },
    // 3. Remove the Discard button
    {
      target: "button[name='action_discard']",
      position: 'replace',
      node: null // Removal operation
    },
    // 4. Modify attributes of Save button
    {
      target: "button[name='action_save']",
      position: 'attributes',
      attributes: {
        string: 'Save Book Record',
        class: 'btn-success'
      }
    }
  ]
});
```

#### AST Selector & Transformation Semantics:
1. **Semantic Selectors**:
   - Attribute Selector: `tag[key='value']` (e.g. `field[name='title']`, `button[name='action_save']`).
   - Structural ID: `#main_details` matches `node.id === 'main_details'`.
   - Direct Tag: `header` matches the first `<header>` node in the view.
2. **Ambiguity and Missing Node Error Handling**:
   - If a selector matches zero nodes: The compiler emits an actionable warning:
     `[ViewCompilerWarning] Addon 'library_custom' in extension 'library_custom.book_form_view_extension' cannot locate target node "field[name='nonexistent']" in base view 'library.book_form_view'. Operation skipped.`
     *The application continues running the remaining valid transformations rather than crashing the UI.*
   - If a selector matches multiple nodes ambiguously: The compiler throws a strict build error during validation:
     `[ViewCompilerError] Ambiguous selector "field" matched 3 nodes in view 'library.book_form_view'. Use explicit attribute qualifiers like "field[name='title']".`

---

### 2.4 Method Override & Middleware Onion Pipeline API (`@mosi/kernel`)

Mosi eliminates prototype mutation in favor of a deterministic, composable middleware pipeline.

#### The `next()` Pipeline Contract:
```typescript
export type MiddlewareNext<TArgs extends any[] = any[], TResult = any> = 
  (...args: TArgs) => Promise<TResult>;

export interface ExecutionContext {
  model: string;
  method: string;
  tenantId: string;
  userId: string;
  env: RuntimeEnvironment;
}

export type MethodOverrideHandler<TArgs extends any[] = any[], TResult = any> = 
  (next: MiddlewareNext<TArgs, TResult>, context: ExecutionContext) => 
    (...args: TArgs) => Promise<TResult>;
```

#### Override Registration Types:
1. **`wrap`**: Full interceptor. Receives `next`. Can inspect/modify arguments, execute pre-logic, await `next(...modifiedArgs)`, and inspect/modify the return value.
2. **`before`**: Hook executed prior to the pipeline. Cannot short-circuit unless it throws an exception (e.g. validation failure).
3. **`after`**: Hook executed after the pipeline successfully returns. Receives the final result.
4. **`replace`**: Deliberately replaces the underlying pipeline. It does **not** call `next()`.

#### Code Example: Stacking Overrides Across Addons:

```typescript
// 1. Base Addon: library/src/index.ts
registerBaseMethod({
  model: 'library.book',
  method: 'action_save',
  handler: async (record, env) => {
    return await env.data.save('library.book', record);
  }
});

// 2. Extension Addon B: library_custom/src/index.ts
// Depends on 'library'
registerMethodOverride({
  model: 'library.book',
  method: 'action_save',
  addon: 'library_custom',
  type: 'wrap',
  handler: (next, context) => async (record, env) => {
    // Pre-processing & validation
    if (record.isbn && !isValidIsbn(record.isbn)) {
      throw new Error(`Invalid ISBN format: ${record.isbn}`);
    }
    
    // Invoke upstream (calls base implementation)
    const savedRecord = await next(record, env);
    
    // Post-processing
    env.logger.info(`Book saved with ISBN: ${savedRecord.isbn}`);
    return savedRecord;
  }
});

// 3. Extension Addon C: library_audit/src/index.ts
// Depends on 'library_custom'
registerMethodOverride({
  model: 'library.book',
  method: 'action_save',
  addon: 'library_audit',
  type: 'before',
  handler: async (record, env) => {
    await env.data.create('audit.log', {
      entity: 'library.book',
      action: 'save_attempt',
      timestamp: new Date().toISOString()
    });
  }
});
```

#### How Stacking Works Without Bypassing:
Because `library_audit` depends on `library_custom` which depends on `library`, the topological DAG resolver constructs the call onion from outside to inside:
$$\text{Invocation} \rightarrow \text{library\_audit (before)} \rightarrow \text{library\_custom (wrap)} \rightarrow \text{library (base)}$$
`library_custom` cannot be bypassed because `library_audit` wraps the entire upstream chain.

#### Detecting Conflicting Replacements:
If two independent addons (`Addon X` and `Addon Y`) both register `type: 'replace'` on the same method at the same priority level without a dependency relationship between them, Mosi's compiler detects the conflict during registry construction and halts with an actionable error:
```
[RegistryConflictError] Conflicting replacement detected for method 'library.book.action_save'.
Both 'addon_x' and 'addon_y' registered a 'replace' override without a mutual dependency.
Resolution: Either have one addon depend on the other, or assign explicit non-identical priorities.
```

---

### 2.5 StorageAdapter & Firestore Mock API (`@mosi/data-api`)

To ensure that tests and local development run without network calls while validating the exact same logic that executes in production Firebase, Mosi defines an abstract `StorageAdapter`.

```typescript
export interface QueryFilter {
  field: string;
  op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in';
  value: any;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
}

export interface StorageAdapter {
  get(collection: string, id: string): Promise<Record<string, any> | null>;
  query(collection: string, options?: QueryOptions): Promise<Record<string, any>[]>;
  create(collection: string, data: Record<string, any>): Promise<string>;
  update(collection: string, id: string, data: Record<string, any>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  
  // Atomic batch support (matching Firestore limits)
  batch(): StorageBatch;
}

export interface StorageBatch {
  set(collection: string, id: string, data: Record<string, any>): void;
  update(collection: string, id: string, data: Record<string, any>): void;
  delete(collection: string, id: string): void;
  commit(): Promise<void>;
}
```

* `InMemoryStorageAdapter`: Fully implements `StorageAdapter` with deep-cloning, transactional rollbacks, and strict 500-operation batch limits to mirror Firestore behavior locally.
* `FirestoreClientAdapter`: Implements `StorageAdapter` via the official Firebase Web/Node SDK.

---

### 2.6 Migration API & Checkpoint Contract (`@mosi/migration-engine`)

#### Migration Definition Contract:
```typescript
export interface MigrationStepContext {
  storage: StorageAdapter;
  tenantId: string;
  batchRunner: {
    // Cursor-paginated batch processor with automatic 500-record chunking
    processEach(
      collection: string, 
      batchSize: number, 
      transform: (doc: Record<string, any>) => Record<string, any> | null | Promise<Record<string, any> | null>
    ): Promise<{ processed: number; modified: number }>;
  };
}

export interface MigrationDefinition {
  id: string;              // e.g. "library_1.1.0_01_init_isbn"
  addon: string;           // "library"
  targetVersion: string;   // "1.1.0"
  sequence: number;        // 1, 2, 3...
  description: string;
  
  up(context: MigrationStepContext): Promise<void>;
  down?(context: MigrationStepContext): Promise<void>;
}
```

#### Checkpointing & Multi-Batch Failure Handling:
Firestore batches are atomic up to 500 writes. For collections with 10,000 documents, a migration requires 20 distinct batches.
If batch 14 fails due to network termination:
1. `_mosi_migrations` documents store:
   ```json
   {
     "migrationId": "library_1.1.0_01_init_isbn",
     "step": 1,
     "status": "in_progress",
     "lastProcessedDocId": "book_doc_7000",
     "updatedAt": "2026-10-14T13:30:00Z"
   }
   ```
2. Migrations are mandated to be **idempotent**:
   `if (!doc.isbn) { return { isbn: 'UNASSIGNED' }; } return null;`
3. Upon retry, `batchRunner.processEach` reads `lastProcessedDocId` and resumes via `startAfter(lastProcessedDocId)`. Documents modified in batches 1–13 are skipped without error or duplicate mutation.
4. Only when the final batch completes is the status updated to `"completed"`.

---

## 3. The Lifecycle State Machine

An addon on the Mosi server moves through the following explicit states for a specific tenant:

```
                      [ DISCOVERED ]
                            |
           Manifest valid & | Dependencies
            dependencies ok | missing
                            v
                     [ INSTALLABLE ]  <----------------+
                            |                          |
               Install init |                          |
                            v                          |
                      [ INSTALLING ]                   |
                            |                          |
             +--------------+--------------+           |
             | Migration                   | Migration | Rollback
             | Success                     | Failure   | & Repair
             v                             v           |
        [ INSTALLED ]            [ FAILED_MIGRATION ] -+
             |
             | Tenant session active
             v
         [ ACTIVE ] (Bound to AddonSetFingerprint)
             |
             | Addon code on server updated
             v
       [ UPGRADE_PENDING ]
```

### Lifecycle State Definitions:
1. **Discovered**: Directory exists in `addonsPaths` with a parseable `manifest.ts`.
2. **Installable**: All dependencies declared in `manifest.depends` are present on the server and version-compatible.
3. **Installing**: Tenant has triggered installation; client-side pre-migrations and Firestore batch runners are actively processing.
4. **Installed**: All migrations and prerequisite checks have succeeded. Recorded in `_mosi_installed_addons`.
5. **Active**: The addon is included in the tenant's compiled `AddonSetFingerprint` and active in the user session.
6. **Upgrade-Pending**: The server has a higher version of the addon on disk than what is currently recorded in the tenant's `_mosi_installed_addons`.
7. **Failed-Migration**: A migration step failed. Activation is **strictly blocked**. The tenant session continues using their previous stable registry fingerprint.

---

## 4. Deterministic Registry Pool & Invalidation Lifecycle

### 4.1 Composite Fingerprint Algorithm
To guarantee that identical compositions share memory while any variance creates complete isolation, the registry fingerprint is computed from the full compilation signature:

$$\text{Signature} = \text{TopologicalOrder} \oplus \text{VersionTuples} \oplus \text{ExtensionSequence} \oplus \text{AddonCodeHashes}$$

```typescript
export function computeRegistryFingerprint(
  resolvedAddons: { id: string; version: string; codeHash: string }[],
  extensionOrder: string[]
): string {
  const payload = resolvedAddons
    .map(a => `${a.id}@${a.version}:${a.codeHash}`)
    .join('|') + '##' + extensionOrder.join('>');
    
  return createHash('sha256').update(payload).digest('hex');
}
```

### 4.2 Pool Management & Safe Invalidation
```
+-----------------------------------------------------------------------------------------+
| REGISTRY POOL (Server In-Memory Map: Fingerprint -> CompiledRegistry)                    |
|                                                                                         |
|  Entry A: "a3f89b..." (library@1.0.0) -> [Active: Tenant 1, Tenant 3]                  |
|  Entry B: "c72e10..." (library@1.0.0 + library_custom@1.0.0) -> [Active: Tenant 2]     |
|                                                                                         |
|  * Compiled once per unique signature.                                                  |
|  * Retained in memory while active in-flight requests hold a reference counter.        |
+-----------------------------------------------------------------------------------------+
```

1. **In-Flight Safety (Graceful Drain)**:
   - When an addon code changes or a tenant upgrades, the old `CompiledRegistry` is marked `deprecated`.
   - Any currently executing HTTP request holds a reference lock on that registry instance until the request completes.
   - Once all active requests release their lock, the old registry entry is retired from memory.
2. **Development Mode Auto-Invalidation**:
   - In `mosi dev`, the file-watcher monitors all addon directories.
   - Any `.ts` file edit updates the addon's `codeHash`.
   - The server immediately clears the `RegistryPool`. The next incoming request compiles a fresh registry reflecting the modified code.

---

## 5. Security & Index Deployment Architecture

### 5.1 Firestore Security Rules Compiler
Addons declare their private collection security rules in `rules.firestore`. Mosi forbids arbitrary rule concatenation to prevent an addon from accidentally weakening tenant security.

#### Addon Rule Fragment (`addons/library/rules.firestore`):
```firestore
match /library_books/{bookId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.token.role == 'librarian';
}
```

#### Compiler CLI Command:
```bash
mosi security compile-rules --out ./firestore.rules
```
The compiler:
1. Validates that no addon rule contains root wildcards (`match /{document=**}`).
2. Wraps tenant collections in strict multi-tenant ownership checks.
3. Produces a single, hardened `firestore.rules` file for deployment via `firebase deploy --only firestore:rules`.

### 5.2 Composite Index Generator
When `mosi addons inspect <addon>` or `mosi deploy check-indexes` runs:
1. It compares the indexes declared in `manifest.indexes` against the project's `firestore.indexes.json`.
2. It outputs:
   - The missing index definitions ready to paste into `firestore.indexes.json`.
   - Direct Firebase CLI command: `firebase deploy --only firestore:indexes`.

---

## 6. Concrete Proof-of-Concept Implementation Sequence

The PoC will be built incrementally, verifying each architectural boundary before moving forward:

```
[Phase 1: Kernel & CLI Discovery]
  ├── pnpm workspace setup & tsconfig.base.json
  ├── @mosi/kernel: config parser, filesystem scanner, DAG topological resolver
  └── @mosi/cli: `mosi addons list`, `mosi addons inspect <id>`
         |
         v
[Phase 2: Base Engine & In-Memory Storage]
  ├── @mosi/data-api: StorageAdapter & InMemoryStorageAdapter (with 500-op batching)
  ├── @mosi/model-engine: defineModel, extendModel, fields (Char, Integer, Selection)
  └── @mosi/view-engine: defineFormView, extendView, AST builders & transform engine
         |
         v
[Phase 3: Base Domain Addon (`library`)]
  ├── addons/library: manifest, library.book model, book_form_view
  └── Action: action_save base implementation
         |
         v
[Phase 4: Extension Addon (`library_custom`)]
  ├── addons/library_custom: manifest (depends on library)
  ├── In-place model extension: adds `isbn` field
  ├── In-place view extension: inserts ISBN, inserts Print button, removes Discard, modifies Save
  ├── Method override: wraps action_save via middleware to validate ISBN before save
  └── Automated test: Verify library source code has 0 diffs
         |
         v
[Phase 5: Multi-Tenant Registry Isolation Tests]
  ├── Tenant A session (installed: [library])
  ├── Tenant B session (installed: [library, library_custom])
  └── Automated assertions:
        - Tenant A form AST has 2 fields; Save button says "Save"; Discard button exists.
        - Tenant B form AST has 3 fields; Save button says "Save Book Record"; Print exists; Discard gone.
        - Tenant A action_save does not invoke ISBN validation middleware.
        - Tenant B action_save validates ISBN.
        - Zero leakage across memory or mock storage.
```

---
*Specification approved and verified against local Odoo 18 patterns. Ready for review.*
