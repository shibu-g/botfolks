import mysql from 'mysql2/promise';
import { config } from '../config.js';

export const db = mysql.createPool({
  ...config.db,
  connectionLimit: 10,
  namedPlaceholders: true,
  charset: 'utf8mb4',
});

/** MariaDB VECTOR literal: VEC_FromText('[0.1,0.2,...]') */
export const vecText = (v: number[]) => `[${v.join(',')}]`;
