const fs = require('fs');
const path = require('path');

const jobsDir = path.join(__dirname, 'backend/src/jobs');
const files = fs.readdirSync(jobsDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    const fullPath = path.join(jobsDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace import { ioRedis } with import { createIORedisConnection }
    content = content.replace(/import\s*\{\s*([^}]*?)ioRedis([^}]*?)\}\s*from\s*["']\.\.\/lib\/redis["'];?/, 'import { $1createIORedisConnection$2} from "../lib/redis";');
    
    // Replace connection: ioRedis with connection: createIORedisConnection()
    content = content.replace(/connection:\s*ioRedis/g, 'connection: createIORedisConnection()');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
});
