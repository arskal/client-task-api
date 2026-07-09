require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./auth');
const requireAuth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./logger');

const app = express();
const prisma = new PrismaClient();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.use(cors());
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use('/auth', authRoutes);

app.get('/tasks', requireAuth, asyncHandler(async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.user.userId }
  });
  res.json(tasks);
}));

app.post('/tasks', requireAuth, asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    req.log.warn('Task creation failed: missing title');
    return res.status(400).json({ error: 'Title is required' });
  }

  const task = await prisma.task.create({
    data: { title, description, userId: req.user.userId }
  });

  req.log.info({ taskId: task.id }, 'Task created');
  res.status(201).json(task);
}));

app.put('/tasks/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, completed } = req.body;

  const existingTask = await prisma.task.findUnique({ where: { id } });

  if (!existingTask || existingTask.userId !== req.user.userId) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const task = await prisma.task.update({
    where: { id },
    data: { title, description, completed }
  });

  req.log.info({ taskId: task.id }, 'Task updated');
  res.json(task);
}));

app.delete('/tasks/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existingTask = await prisma.task.findUnique({ where: { id } });

  if (!existingTask || existingTask.userId !== req.user.userId) {
    return res.status(404).json({ error: 'Task not found' });
  }

  await prisma.task.delete({ where: { id } });
  req.log.info({ taskId: id }, 'Task deleted');
  res.status(204).send();
}));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
