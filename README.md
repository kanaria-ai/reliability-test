# Reliability Test

Next.js 기반 S3 파일 뷰어 애플리케이션입니다.

## 설정

1. `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# 인증 정보 (선택사항 - 기본값 사용 가능)
AUTH_USERNAME=admin
AUTH_PASSWORD=kanaria-test-izen

# AWS 자격 증명
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=your-bucket-name
```

**참고:** 인증 정보(`AUTH_USERNAME`, `AUTH_PASSWORD`)를 설정하지 않으면 기본값(admin / kanaria-test-izen)이 사용됩니다.

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

- 🔐 간단한 비밀번호 인증 (내부 팀용)
- 📸 S3 버킷의 이미지 파일 뷰어
- 📄 JSON 파일 목록 및 다운로드
- 📅 날짜 범위 필터링
- 🔍 파일명 검색
- 📱 장치별 필터링
- 🖼️ 이미지 모달 뷰어

## 인증

애플리케이션은 기본적으로 비밀번호 인증이 활성화되어 있습니다. 처음 접속 시 로그인 페이지로 리다이렉트됩니다.

- **기본 아이디:** `admin`
- **기본 비밀번호:** `kanaria-test-izen`

환경 변수 `AUTH_USERNAME`과 `AUTH_PASSWORD`를 설정하여 변경할 수 있습니다.

