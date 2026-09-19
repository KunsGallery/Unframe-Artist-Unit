# Cloudflare R2 미디어 업로드 설정

u.a.u.는 이미지·폰트 파일을 Firebase Storage에 저장하지 않고 Cloudflare R2에 직접 업로드합니다.

업로드 흐름은 다음과 같습니다.

1. 브라우저가 Firebase 로그인 토큰으로 `/api/r2/upload-url`을 호출합니다.
2. Next.js 서버가 Firebase Admin으로 토큰을 검증하고, 짧은 만료시간의 R2 presigned PUT URL을 발급합니다.
3. 브라우저가 파일을 R2로 직접 전송합니다. 고화질 파일이 Next.js/Netlify 서버를 통과하지 않습니다.
4. 업로드가 끝나면 `media_assets` 문서에 파일 키·공개 URL·소유자·용량·MIME 타입이 기록됩니다.

## Netlify 환경변수

`.env.example`의 Firebase 공개 설정과 다음 서버 전용 값을 Netlify에 등록합니다.

```env
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=uau-media
R2_PUBLIC_URL=https://assets.uau.unframe.kr
R2_MAX_UPLOAD_BYTES=52428800

FIREBASE_ADMIN_PROJECT_ID=unframe-uau
# 아래 두 값은 서버에서 Firebase Admin 쓰기 권한이 필요할 때만 등록합니다.
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

이미지 업로드의 로그인 토큰 검증에는 `FIREBASE_ADMIN_PROJECT_ID`만 필요합니다. 조직 정책으로 서비스 계정 키 생성을 제한한 Firebase/Google Cloud 프로젝트에서도 업로드 기능을 사용할 수 있습니다. `FIREBASE_ADMIN_CLIENT_EMAIL`과 `FIREBASE_ADMIN_PRIVATE_KEY`는 향후 서버가 Firebase Admin 쓰기 권한을 직접 써야 할 때만 추가하세요.

`FIREBASE_ADMIN_PRIVATE_KEY`는 줄바꿈을 실제 줄바꿈으로 넣거나 `\\n` 형태로 넣을 수 있습니다. 서버 코드가 두 형식을 모두 처리합니다. R2 비밀키와 Firebase Admin 비밀키에는 `NEXT_PUBLIC_` 접두사를 사용하면 안 됩니다.

## R2 버킷과 공개 도메인

Cloudflare에서 다음을 준비합니다.

- 버킷: `uau-media`
- R2 API 토큰: 객체 읽기·쓰기 권한을 필요한 버킷으로만 제한
- Custom Domain: `assets.uau.unframe.kr`
- `R2_PUBLIC_URL`: 위 Custom Domain의 origin URL

공개 도메인은 이미지와 폰트가 브라우저에서 읽힐 수 있도록 연결합니다. API 토큰 자체는 브라우저에 노출하지 않습니다.

## R2 CORS

R2 버킷의 CORS 설정에 아래 정책을 등록합니다. 실제 운영 주소가 추가되면 `AllowedOrigins`에 함께 넣습니다.

```json
[
  {
    "AllowedOrigins": [
      "https://uau.unframe.kr",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

presigned URL은 발급 후 15분 동안만 유효합니다. 업로드 파일은 기본 50MB까지 허용되며, `R2_MAX_UPLOAD_BYTES`로 조정할 수 있습니다. 작품 원본 업로드를 더 크게 허용할 때는 비용·실패 재시도·모바일 네트워크를 함께 검토해야 합니다.

## Firestore 문서

업로드가 성공하면 `media_assets` 컬렉션에 다음 메타데이터가 저장됩니다.

- `ownerUid`: Firebase 사용자 UID
- `key`: R2 객체 키
- `publicUrl`: 공개 파일 URL
- `assetType`: `profile`, `cover`, `work`, `font`, `spatial-preview`
- `entityId`: 연결된 프로필·작품·페이지 ID
- `contentType`, `size`, `originalName`
- `visibility`: 현재는 `public`
- `status`: `pending`, `uploaded`, `failed`

업로드 직전에 `pending` 기록을 만들고, R2 전송이 끝나면 `uploaded`, 실패하면 `failed`로 갱신합니다. 따라서 업로드 후 화면 저장에 실패해도 R2 키가 기록에 남아 어드민 정리 대상이 될 수 있습니다. Firestore 규칙은 소유자와 관리자만 메타데이터를 수정·삭제할 수 있도록 제한합니다. 공개 자산은 공개 페이지에서 읽을 수 있습니다.

## 운영 전 체크리스트

- Firebase Auth에 사용하는 운영 도메인을 승인된 도메인에 등록
- Netlify Preview URL을 운영 공개 도메인과 분리해 CORS에 필요한 경우에만 추가
- R2 버킷의 공개 도메인에서 이미지 URL이 `200`으로 응답하는지 확인
- 프로필 이미지 1개, 커버 이미지 1개, 작품 이미지 1개를 각각 업로드해 Firestore와 R2 객체를 함께 확인
- 실패 업로드·취소·큰 파일 오류가 사용자에게 명확히 표시되는지 확인
