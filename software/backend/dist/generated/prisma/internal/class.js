import * as runtime from "@prisma/client/runtime/client";
const config = {
    "previewFeatures": [],
    "clientVersion": "7.8.0",
    "engineVersion": "3c6e192761c0362d496ed980de936e2f3cebcd3a",
    "activeProvider": "postgresql",
    "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Get a free hosted Postgres database in seconds: `npx create-db`\n\ngenerator client {\n  provider = \"prisma-client\"\n  output   = \"../generated/prisma\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n}\n\n//users table\nmodel User {\n  id       Int    @id @default(autoincrement())\n  name     String\n  email    String @unique\n  password String\n  role     Role   @default(USER)\n}\n\nenum Role {\n  USER\n  ADMIN\n  OWNER\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    },
    "parameterizationSchema": {
        "strings": [],
        "graph": ""
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"enum\",\"type\":\"Role\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"User.findUnique\",\"User.findUniqueOrThrow\",\"orderBy\",\"cursor\",\"User.findFirst\",\"User.findFirstOrThrow\",\"User.findMany\",\"data\",\"User.createOne\",\"User.createMany\",\"User.createManyAndReturn\",\"User.updateOne\",\"User.updateMany\",\"User.updateManyAndReturn\",\"create\",\"update\",\"User.upsertOne\",\"User.deleteOne\",\"User.deleteMany\",\"having\",\"_count\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"User.groupBy\",\"User.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"name\",\"email\",\"password\",\"Role\",\"role\",\"equals\",\"in\",\"notIn\",\"not\",\"lt\",\"lte\",\"gt\",\"gte\",\"contains\",\"startsWith\",\"endsWith\",\"set\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "MAsQCBwAACUAMB0AAAQAEB4AACUAMB8CAAAAASABACcAISEBAAAAASIBACcAISQAACgkIgEAAAABACABAAAAAQAgCBwAACUAMB0AAAQAEB4AACUAMB8CACYAISABACcAISEBACcAISIBACcAISQAACgkIgADAAAABAAgAwAABQAwBAAAAQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACAFHwIAAAABIAEAAAABIQEAAAABIgEAAAABJAAAACQCAQgAAAkAIAUfAgAAAAEgAQAAAAEhAQAAAAEiAQAAAAEkAAAAJAIBCAAACwAwAQgAAAsAMAUfAgAwACEgAQAuACEhAQAuACEiAQAuACEkAAAvJCICAAAAAQAgCAAADgAgBR8CADAAISABAC4AISEBAC4AISIBAC4AISQAAC8kIgIAAAAEACAIAAAQACACAAAABAAgCAAAEAAgAwAAAAEAIA8AAAkAIBAAAA4AIAEAAAABACABAAAABAAgBRUAACkAIBYAACoAIBcAAC0AIBgAACwAIBkAACsAIAgcAAAaADAdAAAXABAeAAAaADAfAgAbACEgAQAcACEhAQAcACEiAQAcACEkAAAdJCIDAAAABAAgAwAAFgAwFAAAFwAgAwAAAAQAIAMAAAUAMAQAAAEAIAgcAAAaADAdAAAXABAeAAAaADAfAgAbACEgAQAcACEhAQAcACEiAQAcACEkAAAdJCINFQAAHwAgFgAAJAAgFwAAHwAgGAAAHwAgGQAAHwAgJQIAAAABJgIAAAAEJwIAAAAEKAIAIwAhKQIAAAABKgIAAAABKwIAAAABLAIAAAABDhUAAB8AIBgAACIAIBkAACIAICUBAAAAASYBAAAABCcBAAAABCgBACEAISkBAAAAASoBAAAAASsBAAAAASwBAAAAAS0BAAAAAS4BAAAAAS8BAAAAAQcVAAAfACAYAAAgACAZAAAgACAlAAAAJAImAAAAJAgnAAAAJAgoAAAeJCIHFQAAHwAgGAAAIAAgGQAAIAAgJQAAACQCJgAAACQIJwAAACQIKAAAHiQiCCUCAAAAASYCAAAABCcCAAAABCgCAB8AISkCAAAAASoCAAAAASsCAAAAASwCAAAAAQQlAAAAJAImAAAAJAgnAAAAJAgoAAAgJCIOFQAAHwAgGAAAIgAgGQAAIgAgJQEAAAABJgEAAAAEJwEAAAAEKAEAIQAhKQEAAAABKgEAAAABKwEAAAABLAEAAAABLQEAAAABLgEAAAABLwEAAAABCyUBAAAAASYBAAAABCcBAAAABCgBACIAISkBAAAAASoBAAAAASsBAAAAASwBAAAAAS0BAAAAAS4BAAAAAS8BAAAAAQ0VAAAfACAWAAAkACAXAAAfACAYAAAfACAZAAAfACAlAgAAAAEmAgAAAAQnAgAAAAQoAgAjACEpAgAAAAEqAgAAAAErAgAAAAEsAgAAAAEIJQgAAAABJggAAAAEJwgAAAAEKAgAJAAhKQgAAAABKggAAAABKwgAAAABLAgAAAABCBwAACUAMB0AAAQAEB4AACUAMB8CACYAISABACcAISEBACcAISIBACcAISQAACgkIgglAgAAAAEmAgAAAAQnAgAAAAQoAgAfACEpAgAAAAEqAgAAAAErAgAAAAEsAgAAAAELJQEAAAABJgEAAAAEJwEAAAAEKAEAIgAhKQEAAAABKgEAAAABKwEAAAABLAEAAAABLQEAAAABLgEAAAABLwEAAAABBCUAAAAkAiYAAAAkCCcAAAAkCCgAACAkIgAAAAAAATABAAAAAQEwAAAAJAIFMAIAAAABMQIAAAABMgIAAAABMwIAAAABNAIAAAABAAAAAAUVAAYWAAcXAAgYAAkZAAoAAAAAAAUVAAYWAAcXAAgYAAkZAAoBAgECAwEFBgEGBwEHCAEJCgEKDAILDQMMDwENEQIOEgQREwESFAETFQIaGAUbGQs"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await import('node:buffer');
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
    getQueryCompilerWasmModule: async () => {
        const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
export function getPrismaClientClass() {
    return runtime.getPrismaClient(config);
}
//# sourceMappingURL=class.js.map