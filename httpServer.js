const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const tasks = [
  { id: 1, taskName: 'Prepare monthly report', assignedTo: 'Alice', status: 'In Progress' },
  { id: 2, taskName: 'Update client database', assignedTo: 'Bob', status: 'Pending' },
  { id: 3, taskName: 'Team onboarding session', assignedTo: 'Charlie', status: 'Completed' }
];

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

function sendHTML(res, statusCode, html) {
  res.writeHead(statusCode, { 'Content-Type': 'text/html' });
  res.end(html);
}

function serveHomePage(res) {
  const filePath = path.join(__dirname, 'public', 'index.html');

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error('Error reading index.html:', err.message);
      if (err.code === 'ENOENT') {
        return sendHTML(res, 404, '<h1>404 - index.html not found</h1>');
      }
      return sendHTML(res, 500, '<h1>500 - Internal Server Error</h1>');
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  });
}

function handleAddTask(req, res) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
    if (body.length > 1e6) {
      req.destroy();
    }
  });

  req.on('end', () => {
    let task;

    try {
      task = JSON.parse(body);
    } catch (e) {
      return sendJSON(res, 400, { success: false, message: 'Invalid JSON format' });
    }

    if (typeof task !== 'object' || task === null || Array.isArray(task)) {
      return sendJSON(res, 400, { success: false, message: 'Request body must be a JSON object' });
    }

    const requiredFields = ['id', 'taskName', 'assignedTo', 'status'];
    const missing = requiredFields.filter(
      (f) => task[f] === undefined || task[f] === null || String(task[f]).trim() === ''
    );

    if (missing.length > 0) {
      return sendJSON(res, 400, {
        success: false,
        message: `Missing required field(s): ${missing.join(', ')}`
      });
    }

    if (tasks.some((t) => String(t.id) === String(task.id))) {
      return sendJSON(res, 409, {
        success: false,
        message: `A task with id ${task.id} already exists`
      });
    }

    const newTask = {
      id: task.id,
      taskName: task.taskName,
      assignedTo: task.assignedTo,
      status: task.status
    };

    tasks.push(newTask);
    sendJSON(res, 201, { success: true, message: 'Task added successfully', task: newTask });
  });

  req.on('error', () => {
    sendJSON(res, 400, { success: false, message: 'Error reading request' });
  });
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];
  const method = req.method;

  switch (pathname) {
    case '/':
      if (method !== 'GET') break;
      return sendHTML(
        res,
        200,
        `<h1>Welcome to the Employee Task Management System</h1>
<p>Available routes: <a href="/tasks">/tasks</a>, <a href="/about">/about</a>, <a href="/home">/home</a></p>`
      );

    case '/tasks':
      if (method !== 'GET') break;
      return sendJSON(res, 200, tasks);

    case '/about':
      if (method !== 'GET') break;
      return sendJSON(res, 200, {
        application: 'Employee Task Management',
        version: '1.0.0',
        description: 'A simple application to create, view and manage employee tasks.',
        server: 'Node.js built-in http module'
      });

    case '/home':
      if (method !== 'GET') break;
      return serveHomePage(res);

    case '/add-task':
      if (method !== 'POST') break;
      return handleAddTask(req, res);

    default:
      return sendJSON(res, 404, { success: false, message: 'Route not found' });
  }

  return sendJSON(res, 405, { success: false, message: `Method ${method} not allowed on ${pathname}` });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});