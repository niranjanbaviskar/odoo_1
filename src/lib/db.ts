import mongoose from "mongoose";

function getMongoUri() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error("MONGO_URI is not defined. Set MONGO_URI in your .env (example: mongodb+srv://user:pass@cluster.mongodb.net/dbname)");
    }

    // Basic sanity checks to avoid confusing low-level DNS errors (querySrv ENOTFOUND)
    if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
        throw new Error("MONGO_URI must start with 'mongodb://' or 'mongodb+srv://'. Please set a valid connection string in your .env.");
    }

    // Ensure credentials section doesn't contain multiple unescaped '@' characters
    const afterProtocol = uri.split('://')[1] || '';
    const atCount = (afterProtocol.match(/@/g) || []).length;
    if (atCount !== 1) {
        const masked = uri.replace(/:\/\/(.*)@/, '://<credentials>@');
        throw new Error([
            'MONGO_URI looks malformed (unexpected number of "@" characters).',
            'If your password contains special characters (e.g. "@", ":", "/"), URL-encode them ("@" -> "%40").',
            `Current value (masked): ${masked}`,
            'Example: mongodb+srv://username:password%40with%40signs@cluster.mongodb.net/dbname'
        ].join(' '));
    }

    return uri;
}

declare global {
    var mongooseConnection: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const cached = global.mongooseConnection ?? { conn: null, promise: null };

if (!global.mongooseConnection) {
    global.mongooseConnection = cached;
}

export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(getMongoUri(), {
            bufferCommands: false,
            dbName: process.env.MONGO_DB_NAME,
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
