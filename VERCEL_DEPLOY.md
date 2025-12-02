# Vercel 배포 가이드

## 배포 전 준비 사항

### 1. 환경 변수 준비 ✅

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

#### 필수 환경 변수 (서버 사이드)
- `AWS_ACCESS_KEY_ID` - AWS 액세스 키 ID
- `AWS_SECRET_ACCESS_KEY` - AWS 시크릿 액세스 키
- `AWS_REGION` - AWS 리전 (예: `ap-northeast-2`)
- `AWS_S3_BUCKET_NAME` - S3 버킷 이름 (예: `kanaria-prototype-test`)
- `AUTH_USERNAME` - 로그인 아이디 (기본값: `admin`)
- `AUTH_PASSWORD` - 로그인 비밀번호 (기본값: `kanaria-test-izen`)

#### 공개 환경 변수 (클라이언트 사이드)
- `NEXT_PUBLIC_AWS_REGION` - AWS 리전 (예: `ap-northeast-2`)
- `NEXT_PUBLIC_AWS_S3_BUCKET_NAME` - S3 버킷 이름 (예: `kanaria-prototype-test`)

### 2. 로컬 빌드 테스트

배포 전에 로컬에서 빌드가 성공하는지 확인하세요:

```bash
# 의존성 설치
npm install

# 프로덕션 빌드 테스트
npm run build

# 빌드된 앱 실행 테스트
npm start
```

### 3. Git 저장소 준비

Vercel은 Git 저장소와 연동하여 배포합니다:

```bash
# Git 저장소 초기화 (아직 안 했다면)
git init

# .env 파일이 커밋되지 않도록 확인 (.gitignore에 이미 포함됨)
git add .
git commit -m "Initial commit"
```

### 4. Vercel 배포 단계

1. **Vercel 계정 생성**
   - https://vercel.com 에서 계정 생성 (GitHub 계정으로 연동 권장)

2. **프로젝트 Import**
   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 저장소 선택 또는 직접 업로드

3. **환경 변수 설정**
   - 프로젝트 설정 → Environment Variables
   - 위의 환경 변수들을 모두 추가
   - **중요**: Production, Preview, Development 모두에 설정
   - 인증 정보(`AUTH_USERNAME`, `AUTH_PASSWORD`)는 보안상 Production에만 설정하거나, 모두 동일하게 설정 가능

4. **배포 설정 확인**
   - Framework Preset: Next.js (자동 감지)
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)
   - Install Command: `npm install` (기본값)

5. **배포 실행**
   - "Deploy" 버튼 클릭
   - 빌드 로그 확인

### 5. 배포 후 확인 사항

- [ ] 환경 변수가 올바르게 설정되었는지 확인
- [ ] 로그인 페이지가 정상적으로 표시되는지 확인
- [ ] 인증 후 메인 페이지 접근이 가능한지 확인
- [ ] API 라우트 (`/api/s3/list`)가 정상 작동하는지 확인
- [ ] 이미지가 정상적으로 로드되는지 확인
- [ ] S3 파일 목록이 정상적으로 표시되는지 확인

### 6. 보안 주의사항 ⚠️

- **절대 `.env` 파일을 Git에 커밋하지 마세요** (이미 `.gitignore`에 포함됨)
- AWS 자격 증명은 Vercel 환경 변수로만 관리하세요
- 프로덕션에서는 AWS IAM 역할을 사용하는 것을 권장합니다 (더 안전함)

### 7. 문제 해결

#### 빌드 실패 시
- 빌드 로그 확인
- 로컬에서 `npm run build` 실행하여 오류 확인
- TypeScript 오류가 있다면 수정

#### 환경 변수 오류 시
- Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
- 변수명 오타 확인 (대소문자 구분)
- 재배포 필요

#### API 라우트 오류 시
- Vercel 함수 로그 확인
- AWS 자격 증명이 올바른지 확인
- S3 버킷 권한 확인

## 빠른 배포 명령어 (CLI 사용 시)

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

