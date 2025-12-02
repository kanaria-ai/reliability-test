# Reliability Test

Next.js 기반 S3 파일 뷰어 애플리케이션입니다.

## 설정

1. `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=your-bucket-name
```

2. 의존성 설치:

```bash
npm install
```

3. 개발 서버 실행:

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 기능

- 📸 S3 버킷의 이미지 파일 뷰어
- 📄 JSON 파일 목록 및 다운로드
- 📅 날짜 범위 필터링
- 🔍 파일명 검색
- 📱 장치별 필터링
- 🖼️ 이미지 모달 뷰어

