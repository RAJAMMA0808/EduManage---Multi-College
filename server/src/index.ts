import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PoolClient } from 'pg';
import dbPool from './db';
import { seedDatabase, LATEST_ATTENDANCE_DATE, ALL_SUBJECTS } from './seeder';

//const app = express();
//const PORT = process.env.PORT || 8080;

//app.use(cors());
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: "http://edumanage-app.s3-website-us-east-1.amazonaws.com",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

//app.use(express.json({ limit: '50mb' }));
app.use(express.json({ limit: '50mb' }) as any);

/**
 * SCHEMA VERIFICATION
 * Ensures all required tables and columns exist on startup.
 */
async function verifyDatabaseSchema() {
    let client: PoolClient | undefined;
    console.log("Verifying database schema...");
    try {
        client = await dbPool.connect();
        await client.query('BEGIN');

        // Students Table
        await client.query(`CREATE TABLE IF NOT EXISTS students ( 
            "admissionNumber" VARCHAR(255) PRIMARY KEY, 
            "collegeCode" VARCHAR(10) NOT NULL, 
            "programCode" VARCHAR(10) NOT NULL, 
            "rollNo" VARCHAR(10) NOT NULL, 
            "studentName" VARCHAR(255) NOT NULL, 
            "gender" VARCHAR(1) NOT NULL, 
            "isPlaced" BOOLEAN NOT NULL DEFAULT false, 
            "mobileNumber" VARCHAR(20),
            "fatherMobileNumber" VARCHAR(20)
        );`);

        // Faculty & Staff Tables
        await client.query(`CREATE TABLE IF NOT EXISTS faculty ( 
            "facultyId" VARCHAR(255) PRIMARY KEY, 
            "collegeCode" VARCHAR(10) NOT NULL, 
            "programCode" VARCHAR(10) NOT NULL, 
            "facultyName" VARCHAR(255) NOT NULL, 
            "gender" VARCHAR(1) NOT NULL 
        );`);
        await client.query(`CREATE TABLE IF NOT EXISTS staff ( 
            "staffId" VARCHAR(255) PRIMARY KEY, 
            "collegeCode" VARCHAR(10) NOT NULL, 
            "programCode" VARCHAR(10) NOT NULL, 
            "staffName" VARCHAR(255) NOT NULL, 
            "gender" VARCHAR(1) NOT NULL 
        );`);

        // Performance & Attendance
        await client.query(`CREATE TABLE IF NOT EXISTS student_marks ( 
            id SERIAL PRIMARY KEY, 
            "admissionNumber" VARCHAR(255) REFERENCES students("admissionNumber") ON DELETE CASCADE, 
            semester INTEGER NOT NULL, 
            "subjectCode" VARCHAR(50) NOT NULL, 
            "subjectName" VARCHAR(255) NOT NULL, 
            "marksObtained" INTEGER NOT NULL, 
            "maxMarks" INTEGER NOT NULL, 
            "internalMark" INTEGER, 
            "externalMark" INTEGER 
        );`);
        await client.query(`CREATE TABLE IF NOT EXISTS student_attendance ( 
            id SERIAL PRIMARY KEY, 
            "admissionNumber" VARCHAR(255) REFERENCES students("admissionNumber") ON DELETE CASCADE, 
            date DATE NOT NULL, 
            morning VARCHAR(10) NOT NULL, 
            afternoon VARCHAR(10) NOT NULL 
        );`);
        await client.query(`CREATE TABLE IF NOT EXISTS faculty_attendance ( 
            id SERIAL PRIMARY KEY, 
            "facultyId" VARCHAR(255) REFERENCES faculty("facultyId") ON DELETE CASCADE, 
            date DATE NOT NULL, 
            morning VARCHAR(10) NOT NULL, 
            afternoon VARCHAR(10) NOT NULL 
        );`);
        await client.query(`CREATE TABLE IF NOT EXISTS staff_attendance ( 
            id SERIAL PRIMARY KEY, 
            "staffId" VARCHAR(255) REFERENCES staff("staffId") ON DELETE CASCADE, 
            date DATE NOT NULL, 
            morning VARCHAR(10) NOT NULL, 
            afternoon VARCHAR(10) NOT NULL 
        );`);

        // Financials
        await client.query(`CREATE TABLE IF NOT EXISTS student_fees ( 
            id SERIAL PRIMARY KEY, 
            "admissionNumber" VARCHAR(255) REFERENCES students("admissionNumber") ON DELETE CASCADE, 
            "academicYear" VARCHAR(20) NOT NULL, 
            semester INTEGER NOT NULL, 
            "totalFees" INTEGER NOT NULL, 
            "paidAmount" INTEGER NOT NULL, 
            "dueAmount" INTEGER NOT NULL, 
            status VARCHAR(10) NOT NULL,
            "paymentDate" TIMESTAMPTZ,
            "programCode" VARCHAR(20),
            "admissionType" VARCHAR(255),
            "feeType" VARCHAR(50) DEFAULT 'Tuition'
        );`);

        // Placements
        await client.query(`CREATE TABLE IF NOT EXISTS placement_details ( 
            id SERIAL PRIMARY KEY, 
            "admissionNumber" VARCHAR(255) UNIQUE REFERENCES students("admissionNumber") ON DELETE CASCADE, 
            "companyName" VARCHAR(255) NOT NULL, 
            "hrName" VARCHAR(255), 
            "hrMobileNumber" VARCHAR(20), 
            "studentMobileNumber" VARCHAR(20), 
            "year" VARCHAR(20), 
            "semester" VARCHAR(10), 
            "academicYear" VARCHAR(20), 
            "hrEmail" VARCHAR(255) 
        );`);

        // Audit Logs
        await client.query(`CREATE TABLE IF NOT EXISTS deleted_data_log ( 
            id SERIAL PRIMARY KEY, 
            "studentName" TEXT, 
            "admissionNumber" TEXT NOT NULL, 
            "dataType" TEXT NOT NULL, 
            scope TEXT NOT NULL, 
            "deletedBy" TEXT NOT NULL, 
            timestamp TIMESTAMPTZ DEFAULT NOW(), 
            reason TEXT, 
            "deletedData" JSONB NOT NULL 
        );`);
        
        // GPS Anchoring
        await client.query(`CREATE TABLE IF NOT EXISTS user_gps_anchors ( 
            "userId" VARCHAR(255) NOT NULL, 
            date DATE NOT NULL DEFAULT CURRENT_DATE, 
            lat DOUBLE PRECISION NOT NULL, 
            lng DOUBLE PRECISION NOT NULL, 
            PRIMARY KEY ("userId", date) 
        );`);

        await client.query('CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_student_marks_semester ON student_marks(semester);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_student_fees_academic_year ON student_fees("academicYear");');

        await client.query('COMMIT');
        console.log('Database schema verified successfully.');
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('FATAL: Error verifying database schema on startup:', err);
    } finally {
        if (client) client.release();
    }
}

const ROOM_COORDS = { lat: 17.329173, lng: 78.602754 };

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

app.get('/api/health', async (req: any, res: any) => {
  try {
    const dbResult = await dbPool.query('SELECT NOW()');
    res.json({ status: 'ok', message: 'EduManage server is running healthy!', dbTime: dbResult.rows[0].now });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ status: 'error', message: 'Server error', error: (err as Error).message });
  }
});

app.post('/api/verify-location', async (req: any, res: any) => {
    const { userId, lat, lng } = req.body;
    if (!userId || lat === undefined || lng === undefined) return res.status(400).json({ error: 'Missing parameters' });
    const client = await dbPool.connect();
    try {
        const today = new Date().toISOString().split('T')[0];
        const anchorRes = await client.query('SELECT lat, lng FROM user_gps_anchors WHERE "userId" = $1 AND date = $2', [userId, today]);
        let anchorLat, anchorLng;
        if (anchorRes.rows.length > 0) {
            anchorLat = anchorRes.rows[0].lat; anchorLng = anchorRes.rows[0].lng;
        } else {
            await client.query('INSERT INTO user_gps_anchors ("userId", date, lat, lng) VALUES ($1, $2, $3, $4)', [userId, today, lat, lng]);
            anchorLat = lat; anchorLng = lng;
        }
        const distance = calculateHaversineDistance(anchorLat, anchorLng, ROOM_COORDS.lat, ROOM_COORDS.lng);
        res.json({ distance, lat: anchorLat, lng: anchorLng, anchored: anchorRes.rows.length > 0 });
    } catch (err) { res.status(500).json({ error: (err as Error).message }); }
    finally { client.release(); }
});

app.post('/api/seed-database', async (req: any, res: any) => {
    try { await seedDatabase(); res.json({ message: 'Database seeded.' }); }
    catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.post('/api/upload', async (req: any, res: any) => {
    const { data, dataType, collegeCode } = req.body;
    if (!data || !Array.isArray(data) || !dataType) return res.status(400).json({ success: false, message: 'Invalid payload.' });
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');
        if (collegeCode !== 'ALL') {
            for (const row of data) {
                if (row.collegeCode && String(row.collegeCode).trim().toUpperCase() !== String(collegeCode).trim().toUpperCase()) {
                    throw new Error(`College Mismatch! File has '${row.collegeCode}', you selected '${collegeCode}'.`);
                }
            }
        }
        const studentsToUpsert = new Map();
        for (const row of data) {
            if (!row.admissionNumber) continue;
            const admissionNumber = String(row.admissionNumber).trim().toUpperCase();
            if (!studentsToUpsert.has(admissionNumber)) {
                studentsToUpsert.set(admissionNumber, { admissionNumber, collegeCode: row.collegeCode || collegeCode, programCode: row.programCode || 'CSE', rollNo: row.rollNo || admissionNumber.slice(-2), studentName: row.studentName, gender: row.gender || 'M', fatherMobileNumber: row.fatherMobileNumber });
            }
        }
        for (const student of studentsToUpsert.values()) {
            await client.query(`INSERT INTO students ("admissionNumber", "collegeCode", "programCode", "rollNo", "studentName", "gender", "fatherMobileNumber") VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "collegeCode" = EXCLUDED."collegeCode", "fatherMobileNumber" = COALESCE(EXCLUDED."fatherMobileNumber", students."fatherMobileNumber")`, [student.admissionNumber, student.collegeCode, student.programCode, student.rollNo, student.studentName, student.gender, student.fatherMobileNumber]);
        }
        if (dataType === 'marks') {
            for (const mark of data) {
                 if (!mark.admissionNumber) continue;
                 await client.query(`DELETE FROM student_marks WHERE "admissionNumber" = $1 AND "subjectCode" = $2 AND semester = $3`, [mark.admissionNumber, mark.subjectCode, mark.semester]);
                 await client.query(`INSERT INTO student_marks ("admissionNumber", semester, "subjectCode", "subjectName", "marksObtained", "maxMarks", "internalMark", "externalMark") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [mark.admissionNumber, mark.semester, mark.subjectCode, mark.subjectName, mark.marksObtained, mark.maxMarks, mark.internalMark, mark.externalMark]);
            }
        } else if (dataType === 'fee') {
             for (const fee of data) {
                 if (!fee.admissionNumber) continue;
                 await client.query(`INSERT INTO student_fees ("admissionNumber", "academicYear", semester, "totalFees", "paidAmount", "dueAmount", status, "paymentDate", "programCode", "admissionType", "feeType") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [fee.admissionNumber, fee.academicYear, fee.semester, fee.totalFees, fee.paidAmount, fee.dueAmount, fee.status, fee.paymentDate, fee.programCode, fee.admissionType, fee.feeType || 'Tuition']);
             }
        } else if (dataType === 'studentAttendance') {
            for (const att of data) {
                 if (!att.admissionNumber) continue;
                 const { admissionNumber, date, morning, afternoon } = att;
                 const existing = await client.query('SELECT morning, afternoon FROM student_attendance WHERE "admissionNumber" = $1 AND date = $2', [admissionNumber, date]);
                 if (existing.rows.length > 0) {
                     const finalMorning = morning !== 'Absent' ? morning : existing.rows[0].morning;
                     const finalAfternoon = afternoon !== 'Absent' ? afternoon : existing.rows[0].afternoon;
                     await client.query('UPDATE student_attendance SET morning = $1, afternoon = $2 WHERE "admissionNumber" = $3 AND date = $4', [finalMorning, finalAfternoon, admissionNumber, date]);
                 } else {
                     await client.query('INSERT INTO student_attendance ("admissionNumber", date, morning, afternoon) VALUES ($1, $2, $3, $4)', [admissionNumber, date, morning, afternoon]);
                 }
            }
        }
        await client.query('COMMIT');
        res.json({ success: true, message: `Processed ${data.length} records.`, stats: { totalRows: data.length, processed: data.length, errors: 0 } });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: (error as Error).message });
    } finally { client.release(); }
});

app.post('/api/marks', async (req: any, res: any) => {
    const data = req.body;
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO students ("admissionNumber", "collegeCode", "programCode", "rollNo", "studentName", "gender") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName"`, [data.admissionNumber, data.collegeCode, data.programCode, data.admissionNumber.slice(-2), data.studentName, data.gender]);
        await client.query(`DELETE FROM student_marks WHERE "admissionNumber" = $1 AND "subjectCode" = $2 AND semester = $3`, [data.admissionNumber, data.subjectCode, data.semester]);
        await client.query(`INSERT INTO student_marks ("admissionNumber", semester, "subjectCode", "subjectName", "marksObtained", "maxMarks", "internalMark", "externalMark") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [data.admissionNumber, data.semester, data.subjectCode, data.subjectName, data.marksObtained, data.maxMarks, data.internalMark, data.externalMark]);
        await client.query('COMMIT');
        res.json({ success: true, message: `Marks recorded.` });
    } catch (err) { if (client) await client.query('ROLLBACK'); res.status(500).json({ error: (err as Error).message }); }
    finally { client.release(); }
});

app.post('/api/fees', async (req: any, res: any) => {
    const data = req.body;
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO student_fees ("admissionNumber", "academicYear", semester, "totalFees", "paidAmount", "dueAmount", status, "paymentDate", "programCode", "admissionType", "feeType") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [data.admissionNumber, data.academicYear, data.semester, data.totalFees, data.paidAmount, data.dueAmount, data.status, data.paymentDate, data.programCode, data.admissionType, data.feeType || 'Tuition']);
        await client.query('COMMIT');
        res.json({ success: true, message: `Fee recorded.` });
    } catch (err) { if (client) await client.query('ROLLBACK'); res.status(500).json({ error: (err as Error).message }); }
    finally { client.release(); }
});

app.post('/api/placement', async (req: any, res: any) => {
    const data = req.body;
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`UPDATE students SET "isPlaced" = true, "mobileNumber" = $1 WHERE "admissionNumber" = $2`, [data.studentMobileNumber, data.admissionNumber]);
        await client.query(`INSERT INTO placement_details ("admissionNumber", "companyName", "hrName", "hrMobileNumber", "studentMobileNumber", "year", "semester", "academicYear", "hrEmail") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT ("admissionNumber") DO UPDATE SET "companyName" = EXCLUDED."companyName"`, [data.admissionNumber, data.companyName, data.hrName, data.hrMobileNumber, data.studentMobileNumber, data.year, data.semester, data.academicYear, data.hrEmail]);
        await client.query('COMMIT');
        res.json({ success: true, message: `Placement recorded.` });
    } catch (err) { if (client) await client.query('ROLLBACK'); res.status(500).json({ error: (err as Error).message }); }
    finally { client.release(); }
});

app.post('/api/delete-student-data', async (req: any, res: any) => {
    const { admissionNumber, studentName, tab, academicYear, semester, deletedBy, reason } = req.body;
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');
        let tableName = '';
        let whereClauses: string[] = [`"admissionNumber" = $1`];
        let values: any[] = [admissionNumber];
        let paramCounter = 2;
        if (tab === 'marks') {
            tableName = 'student_marks';
            if (semester !== 'All Semesters') { whereClauses.push(`semester = $${paramCounter++}`); values.push(parseInt(semester, 10)); }
        } else if (tab === 'fees' || tab === 'examFees') {
            tableName = 'student_fees';
            if (academicYear !== 'All Years') { whereClauses.push(`"academicYear" = $${paramCounter++}`); values.push(academicYear); }
            if (semester !== 'All Semesters') { whereClauses.push(`semester = $${paramCounter++}`); values.push(parseInt(semester, 10)); }
        } else if (tab === 'attendance') {
            tableName = 'student_attendance';
            if (academicYear !== 'All Years') { 
                const start = `${academicYear.split('-')[0]}-07-01`;
                whereClauses.push(`date >= $${paramCounter++}`); values.push(start);
            }
        }
        const dataRes = await client.query(`SELECT * FROM ${tableName} WHERE ${whereClauses.join(' AND ')}`, values);
        if (dataRes.rows.length === 0) throw new Error("No records found to delete.");
        await client.query(`INSERT INTO deleted_data_log ("studentName", "admissionNumber", "dataType", scope, "deletedBy", reason, "deletedData") VALUES ($1, $2, $3, $4, $5, $6, $7)`, [studentName, admissionNumber, tab, 'Manual', deletedBy, reason, JSON.stringify(dataRes.rows)]);
        await client.query(`DELETE FROM ${tableName} WHERE ${whereClauses.join(' AND ')}`, values);
        await client.query('COMMIT');
        res.json({ success: true, message: `Deleted ${dataRes.rows.length} records.` });
    } catch (err) { if (client) await client.query('ROLLBACK'); res.status(500).json({ success: false, message: (err as Error).message }); }
    finally { client.release(); }
});

app.get('/api/deleted-log', async (req: any, res: any) => {
    try { const result = await dbPool.query('SELECT * FROM deleted_data_log ORDER BY timestamp DESC'); res.json(result.rows); }
    catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.delete('/api/deleted-log', async (req: any, res: any) => {
    try { await dbPool.query('TRUNCATE TABLE deleted_data_log'); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.post('/api/restore-log', async (req: any, res: any) => {
    const { logIds } = req.body;
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');
        const logsRes = await client.query('SELECT * FROM deleted_data_log WHERE id = ANY($1::int[])', [logIds]);
        for (const log of logsRes.rows) {
            const tableName = log.dataType === 'Marks' ? 'student_marks' : log.dataType === 'Fees' ? 'student_fees' : 'student_attendance';
            for (const item of log.deletedData) {
                const keys = Object.keys(item).filter(k => k !== 'id');
                const cols = keys.map(k => `"${k}"`).join(',');
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
                await client.query(`INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`, keys.map(k => item[k]));
            }
        }
        await client.query('DELETE FROM deleted_data_log WHERE id = ANY($1::int[])', [logIds]);
        await client.query('COMMIT');
        res.json({ success: true, message: "Data restored." });
    } catch (err) { if (client) await client.query('ROLLBACK'); res.status(500).json({ error: (err as Error).message }); }
    finally { client.release(); }
});

const buildWhereClause = (params: Record<string, any>, alias: string) => {
    const clauses: string[] = [];
    const values: any[] = [];
    let counter = 1;
    if (params.college) { clauses.push(`${alias}."collegeCode" = $${counter++}`); values.push(params.college); }
    if (params.department) { clauses.push(`${alias}."programCode" = $${counter++}`); values.push(params.department); }
    if (params.rollNo) { clauses.push(`${alias}."rollNo" = $${counter++}`); values.push(params.rollNo); }
    if (params.year) {
        const yr = String(params.year).split('-')[0];
        clauses.push(`${alias}."admissionNumber" LIKE '%' || $${counter++} || '%'`);
        values.push(yr);
    }
    return { text: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', values };
};

app.get('/api/dashboard', async (req: any, res: any) => {
    const q = req.query as any;
    const normalize = (v: string) => (v && v.toLowerCase() !== 'all' && v.trim() !== '') ? v : undefined;
    const college = normalize(q.college), year = normalize(q.year), department = normalize(q.department), rollNo = normalize(q.rollNo);
    const date = q.date || new Date().toISOString().split('T')[0];
    const client = await dbPool.connect();
    const data: any = {
      studentAttendance: { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0, overallPercentage: 0 },
      studentAcademics: { passPercentage: 0, passCount: 0, failCount: 0, aggregatePercentage: 0 },
      facultyMetrics: { total: 0, fullDay: 0, halfDay: 0, absent: 0 },
      staffMetrics: { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 },
      placementMetrics: { totalStudents: 0, placedStudents: 0, notPlacedStudents: 0, placementPercentage: 0 },
      studentFees: { totalFees: 0, paidAmount: 0, dueAmount: 0, paidCount: 0, partialCount: 0, dueCount: 0 },
    };
    try {
        const { text, values } = buildWhereClause({ college, year, department, rollNo }, 's');
        const studentRes = await client.query(`SELECT "admissionNumber", "isPlaced" FROM students s ${text}`, values);
        const studentIds = studentRes.rows.map(s => s.admissionNumber);
        
        if (studentIds.length > 0) {
            // Overall Attendance Stats
            const overallRes = await client.query(`
                SELECT 
                    COUNT(*) as total_days,
                    COUNT(CASE WHEN morning = 'Present' AND afternoon = 'Present' THEN 1 END) as full,
                    COUNT(CASE WHEN (morning = 'Present' AND afternoon = 'Absent') OR (morning = 'Absent' AND afternoon = 'Present') THEN 1 END) as half
                FROM student_attendance WHERE "admissionNumber" = ANY($1::varchar[])
            `, [studentIds]);

            const oTotal = parseInt(overallRes.rows[0].total_days || 0), oFull = parseInt(overallRes.rows[0].full || 0), oHalf = parseInt(overallRes.rows[0].half || 0);
            
            data.studentAttendance = { 
                total: oTotal, 
                present: oFull + (0.5 * oHalf), 
                absent: oTotal - (oFull + oHalf), 
                fullDay: oFull, 
                halfDay: oHalf, 
                overallPercentage: oTotal > 0 ? parseFloat(((oFull + 0.5 * oHalf) / oTotal * 100).toFixed(1)) : 0 
            };

            // FIXED: Standard JNTUH Pass/Fail Calculation
            // We group marks by student to see who passed EVERY subject.
            const allMarksRes = await client.query(`
                SELECT 
                    "admissionNumber",
                    "marksObtained",
                    "internalMark",
                    "externalMark",
                    "maxMarks"
                FROM student_marks 
                WHERE "admissionNumber" = ANY($1::varchar[])
            `, [studentIds]);

            const marksRows = allMarksRes.rows;
            const marksByStudent = new Map<string, any[]>();
            let globalTotalGot = 0;
            let globalTotalMax = 0;

            marksRows.forEach(row => {
                if (!marksByStudent.has(row.admissionNumber)) marksByStudent.set(row.admissionNumber, []);
                marksByStudent.get(row.admissionNumber)!.push(row);
                globalTotalGot += parseInt(row.marksObtained);
                globalTotalMax += parseInt(row.maxMarks);
            });

            let passCount = 0;
            let assessedStudents = marksByStudent.size;

            marksByStudent.forEach((studentMarks) => {
                const hasFailed = studentMarks.some(mark => {
                    const int = parseInt(mark.internalMark || 0);
                    const ext = parseInt(mark.externalMark || 0);
                    const tot = parseInt(mark.marksObtained || 0);
                    // Pass rules: Int >= 14, Ext >= 21, Tot >= 40
                    return int < 14 || ext < 21 || tot < 40;
                });
                if (!hasFailed) passCount++;
            });

            data.studentAcademics = {
                passCount: passCount,
                failCount: assessedStudents - passCount,
                passPercentage: assessedStudents > 0 ? parseFloat(((passCount / assessedStudents) * 100).toFixed(1)) : 0,
                aggregatePercentage: globalTotalMax > 0 ? parseFloat(((globalTotalGot / globalTotalMax) * 100).toFixed(1)) : 0
            };

            data.placementMetrics.placedStudents = studentRes.rows.filter(s => s.isPlaced).length;
            data.placementMetrics.totalStudents = studentRes.rows.length;
            data.placementMetrics.placementPercentage = studentRes.rows.length > 0 ? parseFloat((data.placementMetrics.placedStudents / studentRes.rows.length * 100).toFixed(1)) : 0;
        }
        res.json(data);
    } catch (err) { res.status(500).json({ error: (err as Error).message }); }
    finally { if (client) client.release(); }
});

app.get('/api/students', async (req: any, res: any) => {
    const q = req.query as any;
    const { text, values } = buildWhereClause({ college: q.college, year: q.year, department: q.department, rollNo: q.rollNo }, 's');
    const client = await dbPool.connect();
    try {
        let sql = `SELECT * FROM students s ${text}`;
        let v = [...values];
        if (q.name) { sql += (v.length ? ' AND' : ' WHERE') + ` LOWER("studentName") LIKE $${v.length + 1}`; v.push(`%${q.name.toLowerCase()}%`); }
        if (q.admissionNumber) { sql += (v.length ? ' AND' : ' WHERE') + ` LOWER("admissionNumber") LIKE $${v.length + 1}`; v.push(`%${q.admissionNumber.toLowerCase()}%`); }
        const result = await client.query(sql + ' LIMIT 100', v);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: (err as Error).message }); }
    finally { client.release(); }
});

app.get('/api/students/:id', async (req: any, res: any) => {
    const client = await dbPool.connect();
    try {
        const s = await client.query('SELECT * FROM students WHERE "admissionNumber" = $1', [req.params.id]);
        if (!s.rows.length) return res.status(404).json({ error: 'Not found' });
        const marks = await client.query('SELECT * FROM student_marks WHERE "admissionNumber" = $1 ORDER BY semester', [req.params.id]);
        const att = await client.query('SELECT * FROM student_attendance WHERE "admissionNumber" = $1 ORDER BY date DESC', [req.params.id]);
        const fees = await client.query('SELECT * FROM student_fees WHERE "admissionNumber" = $1 ORDER BY "paymentDate" DESC', [req.params.id]);
        const placement = await client.query('SELECT * FROM placement_details WHERE "admissionNumber" = $1', [req.params.id]);
        res.json({ ...s.rows[0], marks: marks.rows, attendance: att.rows, fees: fees.rows, placementDetails: placement.rows[0] });
    } catch (err) { res.status(500).json({ error: (err as Error).message }); }
    finally { client.release(); }
});

app.get('/api/subjects', async (req: any, res: any) => {
    const { department, semester } = req.query;
    const deptSubs = ALL_SUBJECTS[department as string];
    if (!deptSubs || !deptSubs[semester as string]) return res.json([]);
    res.json(deptSubs[semester as string].map((s: any) => s.name));
});

app.listen(PORT, () => { console.log(`Server running on ${PORT}`); verifyDatabaseSchema(); });