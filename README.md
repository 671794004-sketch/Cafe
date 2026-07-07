# Caffeine POS - Coffee Shop POS Web Application

ระบบจัดการขายหน้าร้าน (POS) ร้านกาแฟและเบเกอรี่ ดีไซน์พรีเมียม สลับ Light/Dark Mode มีระบบสมาชิกสะสมแต้ม แดชบอร์ดสถิติ และประวัติการทำรายการ

โครงสร้างนี้เป็น **Pure Static Web Application (HTML5, CSS3, JS)**:
1.  **ทดสอบในเครื่องทันที**: สามารถดับเบิ้ลคลิกไฟล์ `index.html` เพื่อเข้าใช้งานแบบออฟไลน์จำลอง (Demo Mode) ได้เลย มีสไตล์กราฟิกสวยงาม โหลดได้ทันทีโดยไม่มีปัญหา CORS หรือสคริปต์ไม่โหลด
2.  **เชื่อมต่อกับ GitHub & Vercel**: อัปขึ้น GitHub และสามารถกำหนดระบบการดึงค่า Supabase Cloud Database แบบอัตโนมัติบนหน้าเว็บของ Vercel ได้

---

## 💻 วิธีการรันในเครื่องส่วนตัว (Local)
1. ดับเบิ้ลคลิกไฟล์ **`index.html`** ในเครื่องของคุณเพื่อรันแอปพลิเคชันผ่านเว็บเบราว์เซอร์ได้ทันที
2. ระบบจำลองข้อมูลสมาชิก (`0812345678`), สินค้า, ประวัติการทำธุรกรรม, และแดชบอร์ดไว้ภายในระบบ Local ในเบราว์เซอร์ของคุณเรียบร้อยแล้ว

---

## 🚀 วิธีการนำขึ้น GitHub & Deploy ไปยัง Vercel

### 1. วิธีอัปโหลดโค้ดขึ้น GitHub (แบบไม่ต้องติดตั้งโปรแกรม Git)
1. ล็อกอินเข้าใช้งาน [GitHub](https://github.com)
2. สร้าง Repository ใหม่ ตั้งชื่อเช่น `caffeine-pos`
3. ที่หน้าแรกของ Repository กดลิงก์ **"uploading an existing file"**
4. ลากไฟล์เหล่านี้ไปวางเพื่ออัปโหลด:
   - `index.html`
   - `style.css`
   - `app.js`
   - `.gitignore`
   - `README.md`
   - `supabase_setup.sql`
5. กดปุ่ม **"Commit changes"**

---

### 2. วิธีตั้งค่า Deploy บน Vercel พร้อมดึงฐานข้อมูล Supabase อัตโนมัติ
แอป POS ตัวนี้ได้รับการออกแบบให้ Vercel สามารถเปลี่ยนค่า Credentials ของ Supabase ตอนนำขึ้นออนไลน์ได้ทันที โดยตั้งค่าดังนี้:

1. ล็อกอินเข้าสู่ระบบ [Vercel](https://vercel.com)
2. คลิกปุ่ม **"Add New"** -> **"Project"** และกด **"Import"** โปรเจกต์ `caffeine-pos` จาก GitHub
3. ในหน้าตั้งค่าโปรเจกต์ (Configure Project):
   - **Framework Preset**: เลือกสลับเป็น **"Other"**
    - **Build and Output Settings** (คลิกขยายออก):
     - **Build Command**: เปิดสวิตช์ On แล้วคัดลอกคำสั่งด้านล่างนี้ไปวาง:
       ```bash
       sed -i "s|%%VITE_SUPABASE_URL%%|$VITE_SUPABASE_URL|g" app.js && sed -i "s|%%VITE_SUPABASE_ANON_KEY%%|$VITE_SUPABASE_ANON_KEY|g" app.js && sed -i "s|%%VITE_GA_MEASUREMENT_ID%%|$VITE_GA_MEASUREMENT_ID|g" index.html
       ```
       *(คำสั่งนี้จะนำคีย์ Supabase ไปผูกใน app.js และรหัส GA4 ไปผูกใน index.html ให้อัตโนมัติเมื่อขึ้นเซิร์ฟเวอร์)*
     - **Output Directory**: เปิดสวิตช์ On แล้วกรอกสัญลักษณ์จุดตัวเดียว: **`.`**
4. **Environment Variables** (ขยายออกเพื่อกรอกคีย์ Supabase และ Analytics):
   - ช่อง Name: **`VITE_SUPABASE_URL`** | Value: (ระบุ Supabase URL ของคุณ)
   - ช่อง Name: **`VITE_SUPABASE_ANON_KEY`** | Value: (ระบุ Supabase Anon Key ของคุณ)
   - ช่อง Name: **`VITE_GA_MEASUREMENT_ID`** | Value: (ระบุรหัส GA4 ของคุณ เช่น `G-XXXXXXXXXX` - ถ้าไม่ต้องการวัดผลให้ปล่อยว่างไว้)
   - กดปุ่ม **"Add"** สำหรับแต่ละตัวแปร
5. กดปุ่ม **"Deploy"** สีฟ้าเพื่อยืนยันนำแอปขึ้นเซิร์ฟเวอร์ออนไลน์

เมื่อระบบทำการดีพล็อยสำเร็จ แอป POS จะออนไลน์พร้อมเชื่อมต่อเข้าฐานข้อมูล Supabase และติดแท็กวัดสถิติการใช้งาน Google Analytics 4 (GA4) ให้อัตโนมัติ!
