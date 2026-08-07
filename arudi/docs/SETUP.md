# دليل الضبط: قاعدة البيانات وتسجيل الدخول

> **لا تضع أيّ مفتاح في الشيفرة ولا في محادثة ولا في المستودع.** المفاتيح تُوضع في
> متغيّرات البيئة وحدها: ملف `.env` محلّياً (وهو مستبعَد من git)، أو لوحة متغيّرات البيئة
> عند مزوّد الاستضافة عند النشر. وإن تسرّب مفتاح يوماً فأبطِله من لوحة المزوّد ووَلِّد غيره؛
> حذفه من الملف وحده لا يكفي.

الموقع يعمل كاملاً بلا أيّ ممّا يلي. هذا الدليل لمن أراد الحسابات والمزامنة ولوحة إدارةٍ
قابلة للتحرير.

---

## ١. البداية

```bash
cp .env.example .env
```

ثم املأ ما تحتاجه فقط. كل قسمٍ أدناه مستقلّ عن غيره.

---

## ٢. سرّ NextAuth (مطلوب لأيّ جهة دخول)

```bash
openssl rand -base64 32
```

ضع الناتج في:

```env
NEXTAUTH_SECRET="الناتج هنا"
NEXTAUTH_URL="https://your-domain.com"   # أو http://localhost:3000 محلياً
```

`NEXTAUTH_URL` يجب أن يطابق العنوان الذي يُفتح منه الموقع فعلاً، وإلا فشلت دورة الإرجاع.

---

## ٣. قاعدة البيانات (PostgreSQL)

```env
DATABASE_URL="postgresql://user:password@host:5432/arudi?schema=public"
```

ثم:

```bash
npm run db:push     # إنشاء الجداول
npm run db:seed     # بذر البحور والتفعيلات والمعجم والدروس (١٣ ألف كلمة)
```

أي PostgreSQL يفي: مُدار (Neon، Supabase، Railway، RDS) أو محلّي. بعض المزوّدين
يطلبون `?sslmode=require` في آخر الرابط.

---

## ٤. تسجيل الدخول بجوجل

١. افتح [Google Cloud Console](https://console.cloud.google.com) وأنشئ مشروعاً أو اختر واحداً.
٢. **APIs & Services ← OAuth consent screen**: اختر External، واملأ اسم التطبيق وبريد الدعم.
٣. **APIs & Services ← Credentials ← Create Credentials ← OAuth client ID**، والنوع
   **Web application**.
٤. في **Authorized JavaScript origins** ضع:

   ```
   https://your-domain.com
   http://localhost:3000
   ```

٥. في **Authorized redirect URIs** ضع بالضبط — واللاحقة `/api/auth/callback/google` لازمة
   ولا تُغيَّر:

   ```
   https://your-domain.com/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

٦. انسخ المفتاحين:

```env
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="...."
```

> أكثر خطأٍ شائع هنا: نسيان اللاحقة `/api/auth/callback/google`، أو وضع `http` بدل `https`
> في نطاق الإنتاج. الخطأ الناتج يكون `redirect_uri_mismatch`.

---

## ٥. تسجيل الدخول بآبل

آبل أعقد من جوجل، وله ثلاثة قيود ينبغي معرفتها قبل البدء:

- يحتاج **عضوية Apple Developer المدفوعة**.
- لا يقبل `localhost` عنواناً للإرجاع، فلا يمكن تجربته محلياً إلا عبر نفقٍ بـHTTPS.
- «السرّ» ليس نصّاً ثابتاً بل **رمز JWT مُوقَّع**، وأقصى صلاحيته **ستة أشهر**، فيجب تجديده.

الخطوات:

١. **Certificates, Identifiers & Profiles ← Identifiers**: أنشئ **App ID** وفعّل فيه
   *Sign in with Apple*.
٢. أنشئ **Services ID** (هذا هو `CLIENT_ID`)، ثم **Configure**:
   - Domains: `your-domain.com`
   - Return URLs: `https://your-domain.com/api/auth/callback/apple`
٣. **Keys ← +**: مفتاح جديد مفعَّل فيه *Sign in with Apple*، ونزّل ملف `.p8`.
   **لا يُنزَّل إلا مرّة واحدة** — احفظه في مكانٍ آمن.
٤. وَلِّد السرّ: رمز JWT بخوارزمية `ES256` موقَّع بذلك الملف، حقوله:
   `iss` = Team ID، و`sub` = Services ID، و`aud` = `https://appleid.apple.com`،
   و`kid` = معرّف المفتاح.

```env
APPLE_CLIENT_ID="com.example.arudi"   # الـServices ID
APPLE_CLIENT_SECRET="رمز JWT المولَّد"
```

> ضع في تقويمك تذكيراً قبل انتهاء الستة أشهر؛ فانتهاء السرّ يوقف الدخول بآبل فجأةً
> دون رسالة واضحة.

---

## ٦. الدخول بالبريد

```env
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="العروض <no-reply@your-domain.com>"
```

**يحتاج قاعدة بيانات** ليحفظ رموز التحقّق. وإن ضُبط بلا `DATABASE_URL` عُطِّل وحده وظهر
تنبيهٌ في صفحة الدخول — وهذا مقصود: تسجيله بلا قاعدة يجعل NextAuth يرفض كل الطلبات
فيتعطّل الدخول كلّه لا البريد فقط.

---

## ٧. المديرون

```env
ADMIN_EMAILS="you@example.com,partner@example.com"
```

هؤلاء وحدهم يستطيعون التحرير والحذف في لوحة الإدارة وقراءة قائمة المستخدمين. ويمكن
لاحقاً منح الصلاحية من قاعدة البيانات بجعل `role = 'ADMIN'`:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

وبلا جهة دخولٍ مضبوطة تُرفض الكتابة على الجميع — لا يصحّ أن يكون المحتوى مستباحاً في
موقعٍ بلا هويّات.

---

## ٨. عند النشر

ضع المتغيّرات نفسها في لوحة مزوّد الاستضافة لا في ملف:

| المزوّد | الموضع |
| --- | --- |
| Vercel | Project ← Settings ← Environment Variables |
| Netlify | Site configuration ← Environment variables |
| Railway / Render | Variables |
| Docker | `--env-file` أو `secrets` |

ثم أضف عنوان النطاق إلى قوائم الإرجاع عند جوجل وآبل، واضبط
`NEXT_PUBLIC_SITE_URL` و`NEXTAUTH_URL` عليه.

---

## ٩. التأكّد من أن الضبط سليم

بعد التشغيل:

- افتح `/admin` وانظر جدول **الحسابات وقاعدة البيانات** — يُبيّن لك بالضبط ما المضبوط
  وما الناقص.
- افتح `/signin` — لا تظهر إلا الجهات المضبوطة فعلاً.
- اطلب `/api/health` — يعيد فحوص سلامة المحتوى.
- وللتأكّد من عدم كسر الدخول:

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/session
  ```

  المتوقّع `200`. وإن جاء `500` فراجع سجلّ الخادم؛ أشهر أسبابه ضبط البريد بلا قاعدة بيانات.
