/*
 * Home Loan Prepayment Planner
 * Copyright (C) 2026 Dharmik Shingala
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import fs from 'fs';
import path from 'path';

const src = path.join(process.cwd(), 'dist', 'index.html');
const dest = path.join(process.cwd(), '..', 'index.html');

try {
  fs.copyFileSync(src, dest);
  console.log('Success: Copied web/dist/index.html to repository root index.html');
} catch (err) {
  console.error('Error copying build file:', err);
  process.exit(1);
}
