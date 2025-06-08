# Project Akhir Aplikasi Pengajuan Kegiatan Mahasiswa

## Deskripsi Aplikasi
Aplikasi Pengajuan Kegiatan Mahasiswa adalah sistem manajemen kegiatan mahasiswa yang memungkinkan mahasiswa untuk mengajukan kegiatan dan proposal, serta administrator untuk mengelola dan menyetujui pengajuan tersebut. Aplikasi ini menggunakan arsitektur dual database (MySQL untuk kegiatan, PostgreSQL untuk proposal) dengan penyimpanan file di Google Cloud Storage.

## Teknologi yang Digunakan
- **Frontend**: React.js, Bootstrap, Axios
- **Backend**: Node.js, Express.js
- **Database**: MySQL (Kegiatan), PostgreSQL (Proposal)
- **Storage**: Google Cloud Storage (File PDF)
- **Authentication**: JWT Token

## Setup Project

### Prasyarat
- Node.js (versi 14 atau lebih baru)
- MySQL Server
- PostgreSQL Server
- Google Cloud Storage Account

### 1. Clone Repository
```bash
git clone <repository-url>
cd "Kegiatan Mahasiswa Project"
```

### 2. Menjalankan Backend
```bash
cd backend
npm install
npm install bcrypt jsonwebtoken dotenv cookie-parser pg
```

#### Menjalankan Server Backend
```bash
nodemon index
```

### 3. Menjalankan Frontend
```bash
cd frontend
npm install
npm start
```

## Dokumentasi API

### Base URL
```
http://localhost:5000
```

### 1. Autentikasi & Manajemen User

| Method | Endpoint | Deskripsi | Auth Required | Role |
|--------|----------|-----------|---------------|------|
| POST | `/auth/register/student` | Registrasi mahasiswa baru | ❌ | - |
| POST | `/auth/register/admin` | Registrasi admin baru | ❌ | - |
| POST | `/auth/login` | Login user (mahasiswa/admin) | ❌ | - |
| POST | `/auth/logout` | Logout user | ✅ | All |
| GET | `/auth/profile` | Melihat profil user | ✅ | All |
| PUT | `/auth/profile` | Update profil user | ✅ | All |
| PUT | `/auth/change-password` | Ubah password | ✅ | All |
| POST | `/auth/refresh` | Refresh access token | ❌ | - |

#### Detail Endpoint Autentikasi

**Registrasi Mahasiswa**
```http
POST /auth/register/student
Content-Type: application/json

{
  "email": "mahasiswa@university.com",
  "username": "Nama Mahasiswa",
  "password": "password123",
  "student_id": "STU001",
  "faculty": "Fakultas Ilmu Komputer",
  "major": "Teknik Informatika",
  "phone": "+62812345678"
}
```

**Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "mahasiswa@university.com",
  "password": "password123"
}
```

### 2. Manajemen Kegiatan Mahasiswa (MySQL)

| Method | Endpoint | Deskripsi | Auth Required | Role |
|--------|----------|-----------|---------------|------|
| GET | `/activities` | Melihat daftar kegiatan | ✅ | All |
| GET | `/activities/:id` | Melihat detail kegiatan | ✅ | All |
| POST | `/activities` | Membuat kegiatan baru | ✅ | Student |
| PUT | `/activities/:id` | Update kegiatan | ✅ | Owner/Admin |
| DELETE | `/activities/:id` | Hapus kegiatan | ✅ | Owner/Admin |

#### Detail Endpoint Kegiatan

**Membuat Kegiatan**
```http
POST /activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Festival Budaya 2024",
  "description": "Festival budaya tahunan menampilkan keberagaman tradisi",
  "activity_type": "non_academic",
  "organizer": "Komite Budaya Mahasiswa",
  "location": "Auditorium Kampus Utama",
  "start_date": "2024-06-15T09:00:00Z",
  "end_date": "2024-06-17T18:00:00Z",
  "budget_needed": 50000000,
  "participant_count": 500
}
```

**Query Parameters untuk GET /activities:**
- `status`: filter berdasarkan status (pending, approved, rejected, completed)
- `activity_type`: filter berdasarkan jenis (academic, non_academic)
- `search`: pencarian berdasarkan judul, deskripsi, atau penyelenggara
- `limit`: jumlah data per halaman (default: 50)
- `offset`: offset untuk pagination (default: 0)

### 3. Manajemen Admin untuk Kegiatan

| Method | Endpoint | Deskripsi | Auth Required | Role |
|--------|----------|-----------|---------------|------|
| GET | `/admin/activities` | Melihat semua kegiatan | ✅ | Admin |
| GET | `/admin/activities/stats` | Statistik kegiatan | ✅ | Admin |
| PUT | `/admin/activities/:id/approve` | Setujui kegiatan | ✅ | Admin |
| PUT | `/admin/activities/:id/reject` | Tolak kegiatan | ✅ | Admin |

#### Detail Endpoint Admin Kegiatan

**Menyetujui Kegiatan**
```http
PUT /admin/activities/:id/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "approval_notes": "Kegiatan disetujui dengan alokasi budget 55,000,000 IDR"
}
```

**Menolak Kegiatan**
```http
PUT /admin/activities/:id/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "rejection_reason": "Keterbatasan budget dan konflik jadwal"
}
```

### 4. Manajemen Proposal Mahasiswa (PostgreSQL)

| Method | Endpoint | Deskripsi | Auth Required | Role |
|--------|----------|-----------|---------------|------|
| GET | `/proposals` | Melihat daftar proposal | ✅ | All |
| GET | `/proposals/:id` | Melihat detail proposal | ✅ | Owner/Admin |
| POST | `/proposals` | Membuat proposal manual | ✅ | Student |
| PUT | `/proposals/:id` | Update proposal | ✅ | Owner/Admin |
| DELETE | `/proposals/:id` | Hapus proposal | ✅ | Owner/Admin |
| PUT | `/proposals/:id/submit` | Submit proposal untuk review | ✅ | Owner |

#### Detail Endpoint Proposal

**Membuat Proposal Manual**
```http
POST /proposals
Authorization: Bearer <token>
Content-Type: application/json

{
  "activity_id": 1,
  "title": "Inisiatif Smart Campus",
  "background": "Proposal implementasi solusi IoT untuk manajemen kampus",
  "objectives": "Meningkatkan efisiensi kampus dan pengalaman mahasiswa melalui teknologi",
  "target_audience": "Seluruh komunitas kampus",
  "implementation_plan": "Fase 1: Instalasi sensor IoT, Fase 2: Pengembangan aplikasi mobile",
  "timeline": {
    "phase1": "3 bulan",
    "phase2": "6 bulan"
  },
  "budget_breakdown": {
    "equipment": 75000000,
    "development": 50000000,
    "maintenance": 25000000
  },
  "expected_outcomes": "Pengurangan konsumsi energi, keamanan lebih baik, manajemen fasilitas yang optimal",
  "risk_assessment": "Tantangan teknis, keterbatasan budget, adopsi pengguna",
  "evaluation_method": "Tracking KPI, feedback pengguna, analisis cost-benefit"
}
```

### 5. Upload dan Download File Proposal

| Method | Endpoint | Deskripsi | Auth Required | Role |
|--------|----------|-----------|---------------|------|
| POST | `/proposals/upload` | Upload proposal PDF | ✅ | Student |
| PUT | `/proposals/:id/upload` | Update file proposal | ✅ | Owner/Admin |
| GET | `/proposals/:id/download` | Download file proposal | ✅ | Owner/Admin |
| GET | `/public/proposals/:id/download` | Download publik (proposal approved) | ❌ | - |

#### Detail Endpoint File

**Upload Proposal PDF**
```http
POST /proposals/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "activity_id": "1",
  "title": "Smart Campus Initiative PDF",
  "file": [file PDF, max 50MB]
}
```

**Download File Proposal**
```http
GET /proposals/:id/download
Authorization: Bearer <token>
```

### 6. Manajemen Admin untuk Proposal

| Method | Endpoint | Deskripsi | Auth Required | Role |
|--------|----------|-----------|---------------|------|
| GET | `/admin/proposals` | Melihat semua proposal | ✅ | Admin |
| GET | `/admin/proposals/stats` | Statistik proposal | ✅ | Admin |
| PUT | `/admin/proposals/:id/review` | Review proposal | ✅ | Admin |

#### Detail Endpoint Admin Proposal

**Review Proposal**
```http
PUT /admin/proposals/:id/review
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "approved",
  "reviewer_comments": "Proposal sangat baik dengan rencana implementasi yang jelas. Disetujui untuk pendanaan."
}
```

**Status yang tersedia untuk review:**
- `approved`: Proposal disetujui
- `rejected`: Proposal ditolak
- `revision_required`: Perlu revisi

### 7. Manajemen User (Admin)

| Method | Endpoint | Deskripsi | Auth Required | Role |
|--------|----------|-----------|---------------|------|
| GET | `/admin/users` | Melihat semua user | ✅ | Admin |

### 8. Sistem dan Utilitas

| Method | Endpoint | Deskripsi | Auth Required | Role |
|--------|----------|-----------|---------------|------|
| GET | `/health` | Health check sistem | ❌ | - |
| GET | `/test` | Test koneksi server | ❌ | - |

## Status dan Role dalam Sistem

### Status Kegiatan
- `pending`: Menunggu persetujuan admin
- `approved`: Disetujui admin
- `rejected`: Ditolak admin
- `completed`: Kegiatan selesai dilaksanakan

### Status Proposal
- `draft`: Draft belum disubmit
- `submitted`: Sudah disubmit, menunggu review
- `approved`: Disetujui admin
- `rejected`: Ditolak admin
- `revision_required`: Perlu revisi dari mahasiswa

### Role User
- `user`: Mahasiswa biasa
- `admin`: Administrator sistem

## Response Format

### Sukses Response
```json
{
  "status": "success",
  "message": "Operasi berhasil",
  "data": {
    // data response
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Pesan error",
  "details": "Detail error (hanya di development mode)"
}
```

## Fitur Keamanan

1. **JWT Authentication**: Semua endpoint yang memerlukan autentikasi menggunakan JWT token
2. **Role-based Access Control**: Kontrol akses berdasarkan role user
3. **File Validation**: Hanya file PDF yang diizinkan untuk upload proposal
4. **CORS Configuration**: Konfigurasi CORS yang aman untuk cross-origin requests
5. **Data Validation**: Validasi input pada semua endpoint

## Penggunaan File Storage

File proposal disimpan di Google Cloud Storage dengan fitur:
- Upload file PDF hingga 50MB
- Generate signed URL untuk download yang aman
- Automatic cleanup file orphan
- Stream download untuk file besar

## Error Codes

| HTTP Code | Deskripsi |
|-----------|-----------|
| 200 | OK - Request berhasil |
| 201 | Created - Resource berhasil dibuat |
| 400 | Bad Request - Request tidak valid |
| 401 | Unauthorized - Token tidak valid atau tidak ada |
| 403 | Forbidden - Tidak memiliki permission |
| 404 | Not Found - Resource tidak ditemukan |
| 413 | Payload Too Large - File terlalu besar |
| 500 | Internal Server Error - Error server |

## Troubleshooting

### Database Connection Issues
1. Pastikan MySQL dan PostgreSQL server berjalan
2. Cek konfigurasi database di file `.env`
3. Pastikan database sudah dibuat

### File Upload Issues
1. Cek konfigurasi Google Cloud Storage
2. Pastikan bucket sudah dibuat dan accessible
3. Verify service account permissions

### CORS Issues
1. Pastikan origin frontend sudah dikonfigurasi di backend
2. Cek header CORS pada request
3. Untuk development, gunakan `http://localhost:3000`

## Development Tips

1. Gunakan Postman atau tool sejenis untuk testing API
2. Check file `backend/request.rest` untuk contoh request
3. Enable development mode untuk error details yang lebih lengkap
4. Monitor console logs untuk debugging


