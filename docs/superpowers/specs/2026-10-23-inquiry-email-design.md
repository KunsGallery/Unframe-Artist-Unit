# 문의 이메일 알림 설계

- 날짜: 2026-10-23
- 상태: 설계 승인됨 (대화에서 확정)

## 목표

작품 문의·작가 연락 폼으로 문의가 오면, 작가가 사이트에 접속하지 않아도 이메일로 바로 알고 메일에서 문의자에게 답장할 수 있게 한다.

성공 기준:

- 문의가 저장되면 작가에게 알림 메일, 문의자에게 접수 확인 메일이 발송된다.
- 작가가 알림 메일에서 "답장"하면 문의자 이메일로 간다.
- 메일 발송이 실패해도 문의 저장은 성공하고, 작가는 대시보드에서 문의를 볼 수 있다.
- 운영팀 사본은 환경변수 하나로 켜고 끌 수 있다.

## 범위

포함:

- 작품 문의 (`app/works/[id]/work-inquiry.tsx`)
- 작가 연락 폼 (`app/components/artist-contact.tsx`)

제외 (나중 과제):

- 저장·조회 등 다른 활동 알림 메일
- 작가별 메일 수신 끄기
- 문의 도배 방지(시간당 제한). 지금도 로그인 사용자만 문의할 수 있다.
- 협업·전시 업데이트 간소화 (별도 과제)

## 흐름

```
브라우저 ──POST /api/inquiries (Authorization: Bearer <Firebase ID 토큰>)──▶ Netlify 서버
  1. ID 토큰 서명 검증 → uid, email, name 확보
  2. public_profiles/{artistSlug} 공개 읽기 → ownerUid(작가), 작가명 확인
  3. Firestore REST commit으로 work_inquiries 문서 생성
     - 문의자 본인 ID 토큰으로 요청 → 기존 보안 규칙이 그대로 검사
     - createdAt은 서버 타임스탬프(REQUEST_TIME)
  4. 관리자 Auth로 ownerUid의 로그인 이메일 조회
  5. Resend로 발송
     - 작가: reply_to = 문의자 이메일, 운영팀 사본은 bcc(설정 시)
     - 문의자: 접수 확인
  6. 응답 { ok: true, id, emailed: boolean }
```

요청자 정보(`requesterUid`, `requesterEmail`, `requesterName`)와 `recipientUid`는 클라이언트 입력이 아니라 서버가 토큰·공개 프로필에서 채운다.

## 실패 처리

| 상황 | 결과 |
|---|---|
| 토큰 없음/무효 | 401, 저장 안 함 |
| 입력 검증 실패(메시지 10~2000자 등) | 400, 저장 안 함 |
| 작가 페이지 비공개·없음 | 404, 저장 안 함 |
| 보안 규칙 거부 | 403, 저장 안 함 |
| `RESEND_API_KEY` 없음 | 저장 성공, 메일 건너뜀(`emailed: false`) |
| 관리자 키 없음·잘못됨, 작가 이메일 조회 실패 | 저장 성공, 작가 메일 건너뜀, 문의자 확인 메일은 발송 |
| Resend 오류 | 저장 성공, 서버 로그 기록 |

메일 단계의 오류는 응답을 실패로 만들지 않는다. 오류 메시지에 키나 개인정보를 담지 않는다.

## 구성 요소

- `pages/api/inquiries.ts`: 요청 검증과 흐름 조정. 기존 `pages/api/r2/upload-url.ts`와 같은 Pages API 방식.
- `app/server/firebase-token.ts`: 검증 결과에 `email`, `name` 추가.
- `app/server/inquiry-store.ts`: Firestore REST로 공개 프로필 읽기와 문의 문서 생성(사용자 토큰).
- `app/server/firebase-admin.ts`: 서비스 계정 키가 있을 때만 쓰는 별도 앱으로 `getUser(uid).email` 조회. 기존 토큰 검증용 앱은 그대로 둔다.
- `app/server/inquiry-email.ts`: 작가용·문의자용 메일 제목/HTML/텍스트 생성. 순수 함수, 모든 사용자 입력 HTML 이스케이프.
- `app/server/resend.ts`: Resend REST API 호출(`fetch`, SDK 없음).
- 클라이언트 두 폼: `addDoc` 대신 `/api/inquiries` 호출. 화면 문구와 동작은 그대로.

Firestore 보안 규칙은 변경하지 않는다.

## 메일 내용

- 작가용 제목: `[u.a.u] 새 문의 — {작품명 또는 문의 목적}`
- 본문: 작품 이미지(있으면), 문의 목적·작품 정보, 메시지 전문, 문의자 이름·이메일, 대시보드 문의함 링크, "이 메일에 답장하면 문의자에게 전달됩니다" 안내
- 문의자용 제목: `[u.a.u] {작가명} 작가에게 문의가 전달되었습니다`
- 본문: 보낸 내용 요약, 작가 페이지 링크
- 한국어 본문 + 영어 한 줄. u.a.u 톤(아이보리 배경, 잉크 텍스트, 블루 포인트)의 단순 HTML과 텍스트 버전을 함께 보낸다.

## 환경변수

| 이름 | 필수 | 설명 |
|---|---|---|
| `RESEND_API_KEY` | 메일 발송 시 | Resend API 키 |
| `INQUIRY_EMAIL_FROM` | 메일 발송 시 | 예: `u.a.u <hello@uau.unframe.kr>` (인증된 도메인) |
| `INQUIRY_COPY_EMAIL` | 선택 | 운영팀 숨은참조. 비우면 사본 없음 |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | 작가 메일 시 | 서비스 계정 이메일 |
| `FIREBASE_ADMIN_PRIVATE_KEY` | 작가 메일 시 | 서비스 계정 키(`\n` 이스케이프 허용) |

## 테스트

- 단위(`tests/inquiry-email.test.cjs`): 메일 생성 결과에 이스케이프 적용, reply_to/bcc 구성, 사본 미설정 시 bcc 없음.
- 통합: 모의 Firestore REST + 모의 Resend 서버로 저장→발송 흐름, 메일 실패 시 저장 성공 확인.
- 빌드·타입 검사 통과.
