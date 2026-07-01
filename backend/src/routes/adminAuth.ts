import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Admin } from '../models/Admin';

const router = Router();

export async function seedAdmin() {
  const existing = await Admin.findOne({ username: 'admin' });
  if (!existing) {
    const hashed = await bcrypt.hash('admin123', 12);
    await Admin.create({ username: 'admin', password: hashed });
    console.log('[Admin] Default admin created: admin / admin123');
  }
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ adminId: admin._id.toString() }, config.jwtSecret + '_admin', { expiresIn: '24h' });
    res.json({ token, admin: { username: admin.username } });
  } catch { res.status(500).json({ error: 'Login failed' }); }
});

router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return res.status(401).json({ error: 'Current password is wrong' });
    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to change password' }); }
});

export default router;
