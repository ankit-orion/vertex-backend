import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const FULL_CURRICULUM = [
  {
    id: "web",
    title: "Internet & Web Fundamentals",
    description: "Understand how the web works, from DNS to HTTP and beyond.",
    topics: ["How the Internet Works", "HTTP vs HTTPS", "DNS Resolution", "Domain Names & Hosting", "Client vs Server Architecture", "Request–Response Lifecycle", "Web Browsers Internals", "Cookies vs Local Storage vs Session Storage", "CORS", "Web Security Basics", "REST vs RPC", "WebSockets Basics", "JSON vs XML"]
  },
  {
    id: "html",
    title: "HTML (Structure Layer)",
    description: "Master the structure of the web with semantic HTML and accessibility.",
    topics: ["HTML Document Structure", "Semantic HTML", "Common Tags", "Forms & Input Types", "Accessibility (ARIA)", "Meta Tags & SEO Basics", "Images & Media", "Tables", "HTML Validation", "Microdata & Structured Data", "HTML Performance Best Practices"]
  },
  {
    id: "css",
    title: "CSS (Styling & Layout)",
    description: "Learn to style the web with modern CSS features like Flexbox and Grid.",
    topics: ["CSS Fundamentals", "Selectors", "Specificity", "Box Model", "Units", "Colors", "Typography", "Layout", "Flexbox", "CSS Grid", "Positioning", "Responsive Design", "Media Queries", "Advanced CSS", "Animations", "Transitions", "Variables", "BEM methodology", "CSS Architecture", "Modern CSS", "Container Queries", "Logical Properties", "Modern responsive patterns"]
  },
  {
    id: "js",
    title: "JavaScript Fundamentals",
    description: "The programming language of the web. Learn core concepts to advanced patterns.",
    topics: ["Basics", "Variables", "Data Types", "Operators", "Control Flow", "Functions", "Scope", "Closures", "Objects & Arrays", "Object manipulation", "Array methods", "Iterators", "Asynchronous JS", "Callbacks", "Promises", "Async/Await", "Event Loop", "Browser APIs", "DOM Manipulation", "Events", "Fetch API", "Storage APIs", "Advanced JS", "Prototypes", "Classes", "Modules", "Error handling", "Functional programming patterns"]
  },
  {
    id: "ts",
    title: "TypeScript",
    description: "Add type safety to your JavaScript projects.",
    topics: ["Type System", "Interfaces", "Types vs Interfaces", "Generics", "Utility Types", "Type Narrowing", "Decorators", "Advanced Types", "Type-safe APIs"]
  },
  {
    id: "git",
    title: "Git & Version Control",
    description: "Track changes and collaborate effectively with Git.",
    topics: ["Git Basics", "Commits", "Branching", "Merging", "Rebasing", "Conflict Resolution", "Git Workflows", "GitHub Pull Requests", "Git Hooks", "Semantic Versioning"]
  },
  {
    id: "react",
    title: "Frontend Framework (React)",
    description: "Build modern, interactive UIs with React.",
    topics: ["React Basics", "Components", "JSX", "Props", "State", "Events", "Hooks", "useState", "useEffect", "useRef", "useMemo", "useCallback", "Advanced React", "Context API", "Custom Hooks", "Performance optimization", "Suspense", "Error Boundaries", "Architecture", "Component design patterns", "State management", "Feature folder structure", "Ecosystem", "Routing", "Forms", "Data fetching"]
  },
  {
    id: "node",
    title: "Backend Development",
    description: "Build scalable backends with Node.js and Express.",
    topics: ["Node Basics", "Node architecture", "Event-driven programming", "NPM ecosystem", "API Development", "REST API design", "Middleware", "Controllers", "Error handling", "Authentication", "Sessions", "JWT", "OAuth", "Role-based access", "Security", "Rate limiting", "Input validation", "XSS", "CSRF", "SQL injection"]
  },
  {
    id: "db",
    title: "Databases",
    description: "Store and manage data using relational and non-relational databases.",
    topics: ["SQL", "Relational concepts", "SELECT queries", "Joins", "Aggregations", "Indexing", "Transactions", "Query optimization", "NoSQL", "Document databases", "Schema design", "Indexing", "Aggregation pipelines", "Database Design", "Normalization", "Data modeling", "Scaling databases", "Replication"]
  },
  {
    id: "api",
    title: "API Design",
    description: "Learn to design robust and user-friendly APIs.",
    topics: ["RESTful design", "GraphQL", "API versioning", "Pagination", "Rate limiting", "Idempotency", "Webhooks", "API documentation"]
  },
  {
    id: "auth",
    title: "Authentication & Authorization",
    description: "Secure your applications with industrial-grade auth patterns.",
    topics: ["Sessions", "JWT", "OAuth2", "SSO", "RBAC", "Token refresh strategies", "Password hashing", "MFA"]
  },
  {
    id: "system-design",
    title: "System Design for Web Apps",
    description: "Learn to design large-scale, distributed systems.",
    topics: ["Load balancing", "Caching", "CDN", "Horizontal scaling", "Microservices vs monolith", "Message queues", "Event-driven architecture"]
  },
  {
    id: "perf",
    title: "Performance Optimization",
    description: "Make your apps lightning fast on both frontend and backend.",
    topics: ["Frontend", "Code splitting", "Lazy loading", "Tree shaking", "Bundle optimization", "Backend", "Caching", "DB query optimization", "Async processing", "Infrastructure", "CDN", "Edge computing"]
  },
  {
    id: "testing",
    title: "Testing",
    description: "Ensure code quality with unit, integration, and E2E tests.",
    topics: ["Unit testing", "Integration testing", "E2E testing", "Mocking", "Test driven development", "Tools examples:", "Jest", "Playwright", "Cypress"]
  },
  {
    id: "devops",
    title: "DevOps Basics",
    description: "Automate your deployment pipeline and manage infrastructure.",
    topics: ["CI/CD", "Docker", "Containers", "Deployment strategies", "Environment variables", "Infrastructure as code"]
  },
  {
    id: "cloud",
    title: "Cloud & Deployment",
    description: "Deploy your applications to the cloud at scale.",
    topics: ["Cloud fundamentals", "Serverless", "Edge functions", "Hosting architectures", "CDN", "Autoscaling"]
  },
  {
    id: "realtime",
    title: "Real-Time Applications",
    description: "Build live features using WebSockets and SSE.",
    topics: ["WebSockets", "Server Sent Events", "Pub/Sub systems", "Chat architecture", "Notification systems"]
  },
  {
    id: "security",
    title: "Security Engineering",
    description: "Defend your applications against common vulnerabilities.",
    topics: ["XSS", "CSRF", "CSP", "Secure headers", "Authentication attacks", "OWASP Top 10"]
  },
  {
    id: "adv-frontend",
    title: "Advanced Frontend Architecture",
    description: "Deep dive into state management, micro-frontends, and design systems.",
    topics: ["State management", "Micro frontends", "Design systems", "Component libraries", "Accessibility engineering"]
  }
];

async function main() {
  console.log('Seeding database with full curriculum tracking...');

  const filePath = path.join(__dirname, '../../premium_articles.md');
  const markdown = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  const lines = markdown.split('\n');

  interface TopicWiki {
    title: string;
    content: string;
  }

  interface ModuleWiki {
    title: string;
    topics: TopicWiki[];
  }

  const wikiModules: ModuleWiki[] = [];
  let currentWikiMod: ModuleWiki | null = null;
  let currentWikiTopic: TopicWiki | null = null;

  // Parse markdown for premium content
  for (const line of lines) {
    const modMatch = line.match(/^# Module \d+:\s*(.*)/);
    if (modMatch) {
      if (currentWikiTopic && currentWikiMod) currentWikiMod.topics.push(currentWikiTopic);
      if (currentWikiMod) wikiModules.push(currentWikiMod);
      currentWikiMod = { title: modMatch[1].trim(), topics: [] };
      currentWikiTopic = null;
      continue;
    }

    const topicMatch = line.match(/^##\s*(.*)/);
    if (topicMatch && currentWikiMod) {
      if (currentWikiTopic) currentWikiMod.topics.push(currentWikiTopic);
      if (topicMatch[1].toLowerCase().includes('modules 1–5: foundations')) continue;
      currentWikiTopic = { title: topicMatch[1].trim(), content: "" };
      continue;
    }

    if (currentWikiTopic) {
      currentWikiTopic.content += line + '\n';
    }
  }
  if (currentWikiTopic && currentWikiMod) currentWikiMod.topics.push(currentWikiTopic);
  if (currentWikiMod) wikiModules.push(currentWikiMod);

  // Clear existing
  await prisma.topic.deleteMany();
  await prisma.module.deleteMany();

  // Create all 19 modules
  for (let i = 0; i < FULL_CURRICULUM.length; i++) {
    const modDef = FULL_CURRICULUM[i];
    console.log(`Creating module ${i+1}/${FULL_CURRICULUM.length}: ${modDef.title}`);
    
    // Find if we have wiki content for this module
    const wikiMod = wikiModules.find(w => 
      w.title.toLowerCase().includes(modDef.title.toLowerCase()) ||
      modDef.title.toLowerCase().includes(w.title.toLowerCase())
    );

    const createdModule = await prisma.module.create({
      data: {
        title: modDef.title,
        description: modDef.description,
        order: i + 1,
      }
    });

    if (wikiMod) {
      // Use premium content topics
      for (let j = 0; j < wikiMod.topics.length; j++) {
        const t = wikiMod.topics[j];
        await prisma.topic.create({
          data: {
            title: t.title,
            content: t.content.trim(),
            order: j + 1,
            moduleId: createdModule.id
          }
        });
      }
    } else {
      // Create placeholder topics from defined curriculum
      for (let j = 0; j < modDef.topics.length; j++) {
        const topicName = modDef.topics[j];
        await prisma.topic.create({
          data: {
            title: topicName,
            content: `### ${topicName}\n\nUnderstanding ${topicName} is crucial for any full-stack developer. This guide covers the essentials of ${topicName}.\\n\\n*Content coming soon.*`,
            order: j + 1,
            moduleId: createdModule.id
          }
        });
      }
    }
  }

  console.log('Database seeded successfully with all 19 modules!');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
