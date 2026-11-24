import mysql from 'mysql2/promise';
import { env } from './env.js';
export const db = mysql.createPool({ ...env.db, connectionLimit: 5, charset: 'utf8mb4' });
export const vecText = (v: number[]) => `[${v.join(',')}]`;

const js = env.vectorMode === 'js';
export const VEC_SQL = js ? '?' : 'VEC_FromText(?)';
export const vecParam = (v: number[]) => (js ? JSON.stringify(v) : vecText(v));
