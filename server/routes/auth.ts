import { Router, Response } from 'express';
import { db, User } from '../db.js';
import { generateToken, hashPassword, comparePassword, authenticateToken, AuthRequest } from '../auth.js';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === 'admin' ? 'admin' : 'user',
      phone: phone || '',
      avatar: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 50)}?auto=format&fit=crop&w=120&h=120&q=80`,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    const token = generateToken(newUser);

    const { passwordHash: _, ...userSafe } = newUser;
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userSafe
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server registration error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check credentials (supports quick-demo passwords 'user123' and 'admin123')
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid && !(password === 'user123' && user.email === 'user@imovies.com') && !(password === 'admin123' && user.email === 'admin@imovies.com')) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { passwordHash: _, ...userSafe } = user;

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: userSafe
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server login error' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const { passwordHash: _, ...userSafe } = user;
  return res.json({ success: true, user: userSafe });
});

// Update user profile
router.put('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const { name, phone, avatar } = req.body;
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar) user.avatar = avatar;

  const { passwordHash: _, ...userSafe } = user;
  return res.json({ success: true, message: 'Profile updated', user: userSafe });
});

export default router;
