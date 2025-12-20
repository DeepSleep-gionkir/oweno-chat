
# 🚀 Firebase 실시간 채팅 앱 설정 가이드

이 앱은 Firebase를 백엔드로 사용합니다. 정상 작동을 위해 아래 단계를 반드시 수행하세요.

## 1. Firebase 프로젝트 생성
- [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트를 만듭니다.
- 프로젝트 설정에서 **Web App**을 추가하고 제공되는 `firebaseConfig` 객체를 복사합니다.

## 2. 코드에 설정 반영
- `services/firebaseService.ts` 파일의 `firebaseConfig` 부분을 본인의 설정값으로 교체하세요.

## 3. Firebase 서비스 활성화
- **Authentication**: `Email/Password` 로그인 방법을 활성화하세요.
- **Firestore Database**: 데이터베이스를 생성하고(테스트 모드 권장), 아래 보안 규칙을 설정하세요.
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```
- **Storage**: 스토리지 버킷을 생성하고 아래 보안 규칙을 설정하세요.
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /{allPaths=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

## 4. 이메일 계정 등록
- 앱의 로그인 화면에서 **회원가입**을 통해 친구들의 계정을 직접 만들거나, 친구들에게 가입을 요청하세요.
- 가입된 모든 사용자는 대화 목록에 자동으로 나타납니다.

## 5. 이미지 첨부 기능
- 채팅방 하단의 사진 아이콘을 클릭하여 이미지를 전송할 수 있습니다.
- 업로드 중에는 진행 표시줄이 나타납니다.

## 6. Vercel 배포
- `vercel` 명령어를 통해 배포하거나 GitHub에 푸시하여 자동 배포를 구성하세요.
