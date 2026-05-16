import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';
import AuthData from '../../models/AuthData.js';

export const useDatabaseAuthState = async (sessionId) => {
    const writeData = async (data, id) => {
        try {
            const dataString = JSON.stringify(data, BufferJSON.replacer);
            // Upsert equivalent for composite keys
            const [record, created] = await AuthData.findOrCreate({
                where: { sessionId, id },
                defaults: { data: dataString }
            });
            if (!created) {
                await record.update({ data: dataString });
            }
        } catch (error) {
             console.error(`Error saving auth data for ${id}:`, error);
        }
    };

    const readData = async (id) => {
        try {
            const authData = await AuthData.findOne({
                where: { sessionId, id }
            });
            if (authData && authData.data) {
                return JSON.parse(authData.data, BufferJSON.reviver);
            }
            return null;
        } catch (error) {
            console.error('Error reading auth data', error);
            return null;
        }
    };

    const removeData = async (id) => {
        try {
            await AuthData.destroy({
                where: { sessionId, id }
            });
        } catch (error) {
            console.error('Error removing auth data', error);
        }
    };

    const creds = await readData('creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(value, key) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => {
            return writeData(creds, 'creds');
        }
    };
};

export const clearDatabaseAuthState = async (sessionId) => {
    try {
        await AuthData.destroy({ where: { sessionId } });
    } catch (error) {
        console.error(`Error clearing auth data for session ${sessionId}:`, error);
    }
};
