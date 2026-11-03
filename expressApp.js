const express = require('express');

const app = express();
const PORT = 4000;

app.use(express.json());

let tasks = [
  { id: 1, taskName: 'Develop Login Page', assignedTo: 'Rahul Sharma', status: 'Pending', priority: 'High' },
  { id: 2, taskName: 'Design Database Schema', assignedTo: 'Priya Singh', status: 'In Progress', priority: 'Medium' },
  { id: 3, taskName: 'Write API Documentation', assignedTo: 'Amit Verma', status: 'Completed', priority: 'Low' }
];

const requiredFields = ['taskName', 'assignedTo', 'status', 'priority'];

function getMissingFields(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return requiredFields;
  }
  return requiredFields.filter(
    (field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === ''
  );
}

function findTask(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return null;
  }
  return tasks.find((task) => task.id === id) || null;
}

app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const task = findTask(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.status(200).json(task);
});

app.post('/tasks', (req, res) => {
  const missing = getMissingFields(req.body);

  if (missing.length > 0) {
    return res.status(400).json({
      message: `Missing required field(s): ${missing.join(', ')}`
    });
  }

  let id;

  if (req.body.id !== undefined && req.body.id !== null && String(req.body.id).trim() !== '') {
    id = Number(req.body.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'id must be a positive integer' });
    }

    if (tasks.some((t) => t.id === id)) {
      return res.status(409).json({ message: `A task with id ${id} already exists` });
    }
  } else {
    id = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
  }

  const newTask = {
    id,
    taskName: req.body.taskName,
    assignedTo: req.body.assignedTo,
    status: req.body.status,
    priority: req.body.priority
  };

  tasks.push(newTask);

  res.status(201).json({ message: 'Task added successfully', task: newTask });
});

app.put('/tasks/:id', (req, res) => {
  const task = findTask(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Request body must be a JSON object' });
  }

  const updates = requiredFields.filter((field) => req.body[field] !== undefined);

  if (updates.length === 0) {
    return res.status(400).json({
      message: `Provide at least one of: ${requiredFields.join(', ')}`
    });
  }

  const emptyFields = updates.filter(
    (field) => req.body[field] === null || String(req.body[field]).trim() === ''
  );

  if (emptyFields.length > 0) {
    return res.status(400).json({
      message: `Field(s) cannot be empty: ${emptyFields.join(', ')}`
    });
  }

  updates.forEach((field) => {
    task[field] = req.body[field];
  });

  res.status(200).json({ message: 'Task updated successfully', task });
});

app.delete('/tasks/:id', (req, res) => {
  const task = findTask(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  tasks = tasks.filter((t) => t.id !== task.id);

  res.status(200).json({ message: 'Task deleted successfully', task });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON format' });
  }
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Express server is running at http://localhost:${PORT}`);
});