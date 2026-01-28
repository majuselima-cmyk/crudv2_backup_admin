-- Insert Dummy Data for contact_us table

INSERT INTO public.contact_us (name, email, subject, message, status, created_at)
VALUES 
(
  'Budi Santoso', 
  'budi@example.com', 
  'Kendala Deposit USDT', 
  'Halo Admin, saya mengalami kendala saat melakukan deposit USDT via TRC20. Hash transaksinya tidak terbaca. Mohon bantuannya.',
  'new',
  NOW() - INTERVAL '1 hour'
),
(
  'Siti Aminah', 
  'siti.aminah@test.com', 
  'Pertanyaan tentang Bonus Refferal', 
  'Min, mau tanya. Kalau saya invite teman, bonusnya masuk kapan ya? Apakah real-time atau nunggu approval?',
  'read',
  NOW() - INTERVAL '1 day'
),
(
  'Rudi Hartono', 
  'rudi.sport@gmail.com', 
  'Request Feature Dark Mode', 
  'Aplikasi sudah mantap, tapi kalau bisa tambahkan fitur dark mode biar mata gak sakit kalau trading malam-malam. Thanks!',
  'replied',
  NOW() - INTERVAL '3 days'
),
(
  'John Doe', 
  'john.doe@random.com', 
  'Akun Terkunci', 
  'Tolong dong akun saya terkunci karena salah password 3x. Gimana cara resetnya?',
  'new',
  NOW() - INTERVAL '5 hours'
),
(
  'Maya Putri', 
  'maya.p@yahoo.com', 
  'Withdraw Belum Masuk', 
  'Saya withdraw dari pagi kok belum masuk ke wallet ya? Biasanya cepat. Mohon dicek. ID WD: WD-123456',
  'new',
  NOW() - INTERVAL '30 minutes'
);
