import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const API_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- STARTING AUTHENTICATION SYSTEM TESTS ---\n');

  // 0. Connect to MongoDB directly to clean and verify
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB directly for verification.\n');

  // Clear existing test accounts
  const testEmails = ['student_test@smarthire.com', 'admin_test@smarthire.com'];
  await User.deleteMany({ email: { $in: testEmails } });
  console.log('Cleared any pre-existing test accounts.\n');

  let studentToken = '';
  let adminToken = '';

  try {
    // ----------------------------------------------------
    // TEST 1: Student Registration
    // ----------------------------------------------------
    console.log('--- TEST 1: Student Registration ---');
    const studentPayload = {
      name: 'Test Student',
      email: 'student_test@smarthire.com',
      password: 'password123',
      role: 'student'
    };
    console.log('Request Payload:', JSON.stringify(studentPayload, null, 2));

    const regStudentRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentPayload)
    });
    const regStudentData = await regStudentRes.json();
    
    console.log('Response Status:', regStudentRes.status);
    console.log('Response Payload:', JSON.stringify(regStudentData, null, 2));
    
    if (regStudentRes.ok) {
      studentToken = regStudentData.token;
    }

    // Query DB
    const studentDbEntry = await User.findOne({ email: studentPayload.email });
    console.log('Database Entry (Verified Password Hashing):', JSON.stringify(studentDbEntry, null, 2));
    console.log('\n');

    // ----------------------------------------------------
    // TEST 2: Admin Registration
    // ----------------------------------------------------
    console.log('--- TEST 2: Admin Registration ---');
    const adminPayload = {
      name: 'Test Admin',
      email: 'admin_test@smarthire.com',
      password: 'password123',
      role: 'admin'
    };
    console.log('Request Payload:', JSON.stringify(adminPayload, null, 2));

    const regAdminRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminPayload)
    });
    const regAdminData = await regAdminRes.json();
    
    console.log('Response Status:', regAdminRes.status);
    console.log('Response Payload:', JSON.stringify(regAdminData, null, 2));
    
    if (regAdminRes.ok) {
      adminToken = regAdminData.token;
    }

    // Query DB
    const adminDbEntry = await User.findOne({ email: adminPayload.email });
    console.log('Database Entry:', JSON.stringify(adminDbEntry, null, 2));
    console.log('\n');

    // ----------------------------------------------------
    // TEST 3: Duplicate Email Registration
    // ----------------------------------------------------
    console.log('--- TEST 3: Duplicate Email Registration ---');
    console.log('Attempting to register student again with email:', studentPayload.email);
    console.log('Request Payload:', JSON.stringify(studentPayload, null, 2));

    const duplicateRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentPayload)
    });
    const duplicateData = await duplicateRes.json();
    
    console.log('Response Status:', duplicateRes.status);
    console.log('Response Payload:', JSON.stringify(duplicateData, null, 2));
    console.log('\n');

    // ----------------------------------------------------
    // TEST 4: Login & JWT Generation
    // ----------------------------------------------------
    console.log('--- TEST 4: Login & JWT Generation ---');
    const loginPayload = {
      email: 'student_test@smarthire.com',
      password: 'password123'
    };
    console.log('Request Payload:', JSON.stringify(loginPayload, null, 2));

    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginPayload)
    });
    const loginData = await loginRes.json();
    
    console.log('Response Status:', loginRes.status);
    console.log('Response Payload:', JSON.stringify(loginData, null, 2));
    console.log('\n');

    // ----------------------------------------------------
    // TEST 5: Invalid Credentials (Wrong Password)
    // ----------------------------------------------------
    console.log('--- TEST 5: Invalid Credentials (Wrong Password) ---');
    const wrongLoginPayload = {
      email: 'student_test@smarthire.com',
      password: 'wrongpassword'
    };
    console.log('Request Payload:', JSON.stringify(wrongLoginPayload, null, 2));

    const wrongLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wrongLoginPayload)
    });
    const wrongLoginData = await wrongLoginRes.json();
    
    console.log('Response Status:', wrongLoginRes.status);
    console.log('Response Payload:', JSON.stringify(wrongLoginData, null, 2));
    console.log('\n');

    // ----------------------------------------------------
    // TEST 6: Protected Routes & Auth Header Check
    // ----------------------------------------------------
    console.log('--- TEST 6: Protected Routes (Profile Access) ---');
    
    // 6a. Try without token
    console.log('6a. Requesting profile without Authorization header...');
    const noAuthRes = await fetch(`${API_URL}/auth/profile`);
    const noAuthData = await noAuthRes.json();
    console.log('Response Status (Expected 401):', noAuthRes.status);
    console.log('Response Payload:', JSON.stringify(noAuthData, null, 2));

    // 6b. Try with valid student token
    console.log('\n6b. Requesting profile with valid Student Token...');
    const authRes = await fetch(`${API_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const authData = await authRes.json();
    console.log('Response Status (Expected 200):', authRes.status);
    console.log('Response Payload:', JSON.stringify(authData, null, 2));

    // 6c. Access Admin Only Stats with Student Token
    console.log('\n6c. Attempting Student Access to Admin Stats route (/api/results/stats)...');
    const studentStatsRes = await fetch(`${API_URL}/results/stats`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentStatsData = await studentStatsRes.json();
    console.log('Response Status (Expected 403):', studentStatsRes.status);
    console.log('Response Payload:', JSON.stringify(studentStatsData, null, 2));

    // 6d. Access Admin Only Stats with Admin Token
    console.log('\n6d. Attempting Admin Access to Admin Stats route (/api/results/stats)...');
    const adminStatsRes = await fetch(`${API_URL}/results/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminStatsData = await adminStatsRes.json();
    console.log('Response Status (Expected 200):', adminStatsRes.status);
    console.log('Response Payload:', JSON.stringify(adminStatsData, null, 2));

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n--- TESTS COMPLETED AND MONGO DISCONNECTED ---');
    process.exit(0);
  }
}

runTests();
