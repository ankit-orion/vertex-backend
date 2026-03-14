"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Seeding database from premium_articles.md...');
        const filePath = path.join(__dirname, '../../premium_articles.md');
        const markdown = fs.readFileSync(filePath, 'utf-8');
        const lines = markdown.split('\n');
        const modules = [];
        let currentModule = null;
        let currentTopic = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Check for Module header
            const moduleMatch = line.match(/^# Module \d+:\s*(.*)/);
            if (moduleMatch) {
                if (currentTopic && currentModule) {
                    currentModule.topics.push(currentTopic);
                    currentTopic = null;
                }
                if (currentModule) {
                    modules.push(currentModule);
                }
                currentModule = {
                    title: moduleMatch[1].trim(),
                    description: "",
                    topics: []
                };
                continue;
            }
            // Check for Topic header
            const topicMatch = line.match(/^##\s*(.*)/);
            if (topicMatch && currentModule) {
                if (currentTopic) {
                    currentModule.topics.push(currentTopic);
                }
                // "Modules 1-5: Foundations" is an H2 we want to skip if it's not a real topic
                if (topicMatch[1].toLowerCase().includes('modules 1–5: foundations')) {
                    continue;
                }
                currentTopic = {
                    title: topicMatch[1].trim(),
                    content: ""
                };
                continue;
            }
            // Skip horizontal rules
            if (line.trim() === '---') {
                continue;
            }
            // Accumulate content
            if (currentTopic) {
                currentTopic.content += line + '\n';
            }
            else if (currentModule && !line.match(/^#/)) {
                currentModule.description += line + '\n';
            }
        }
        if (currentTopic && currentModule) {
            currentModule.topics.push(currentTopic);
        }
        if (currentModule) {
            modules.push(currentModule);
        }
        // Now, clear existing database (optional but safe for seeding)
        yield prisma.topic.deleteMany();
        yield prisma.module.deleteMany();
        // Insert into database
        for (let mIdx = 0; mIdx < modules.length; mIdx++) {
            const mod = modules[mIdx];
            console.log(`Creating module: ${mod.title}`);
            const createdModule = yield prisma.module.create({
                data: {
                    title: mod.title,
                    description: mod.description.trim() || mod.title,
                    order: mIdx + 1,
                }
            });
            for (let tIdx = 0; tIdx < mod.topics.length; tIdx++) {
                const topic = mod.topics[tIdx];
                yield prisma.topic.create({
                    data: {
                        title: topic.title,
                        content: topic.content.trim(),
                        order: tIdx + 1,
                        moduleId: createdModule.id
                    }
                });
            }
        }
        console.log('Database seeded successfully!');
    });
}
main()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}))
    .catch((e) => __awaiter(void 0, void 0, void 0, function* () {
    console.error(e);
    yield prisma.$disconnect();
    process.exit(1);
}));
