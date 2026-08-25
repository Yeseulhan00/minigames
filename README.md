# Minigames

브라우저에서 바로 즐기는 작은 게임 모음.

**홈페이지:** https://yeseulhan00.github.io/minigames/

## 게임 목록

### 액션 · 어드벤처
| 게임 | 설명 |
| --- | --- |
| [무궁화 꽃이 피었습니다](games/mugunghwa.html) | 초록불에 전진, 빨간불에 정지. 45초 안에 도착선까지 |
| [거인 사냥꾼](games/giant-hunter.html) | 5단계 보스전. 머리를 맞히면 크리티컬 + 기절 |
| [백룸즈](games/backrooms.html) | 손전등 하나로 어두운 미로에서 출구 찾기 |
| [복셀 크래프트](games/voxel-craft.html) | 블록을 부수고 쌓는 3D 샌드박스 |
| [좀비 서바이버](games/zombie-survivor.html) | 드래그로 이동, 가장 가까운 좀비에게 자동 사격 |
| [사마귀 헌터](games/mantis-hunter.html) | 100스테이지 곤충 사냥. 10스테이지마다 보스 |
| [잠입 감시 기록](games/building-escape.html) | CCTV 화면 속에서 증거 5점을 모아 탈출. 3구역 (키보드 전용) |
| [카피바라의 온천 대모험](games/capybara-adventure.html) | 귤을 다 모아 온천으로. 벌은 피해서 |

### 키우기 · 퍼즐
| 게임 | 설명 |
| --- | --- |
| [드래곤 아일랜드](games/dragon-island.html) | 알을 부화시켜 드래곤을 키우고 팀 전투에 내보내기 |
| [카피바라 온천 팡팡](games/capybara-pop.html) | 같은 카피바라 3개를 맞춰 터뜨리는 3매치 퍼즐 |
| [카드 짝 맞추기](games/memory.html) | 8쌍의 카드를 뒤집어 짝 찾기 |

### 가볍게 한 판
| 게임 | 설명 |
| --- | --- |
| [마피아 게임](games/mafia.html) | 역할 배정부터 밤낮 진행까지, 오프라인 마피아 진행 도우미 |
| [틱택토](games/tictactoe.html) | 미니맥스 AI와 겨루는 3목 두기 |
| [반응 속도 테스트](games/reaction.html) | 초록색이 되면 최대한 빨리 클릭 |

## 구조

```
index.html      게임 목록 허브
style.css       허브와 간단한 게임들이 함께 쓰는 스타일
games/          게임 페이지 (한 파일에 하나씩)
src/            React로 만든 게임의 원본 (.jsx)
assets/         src/를 번들링한 결과물 — 커밋해서 그대로 서빙
build.mjs       esbuild 번들 스크립트
```

대부분의 게임은 의존성 없는 단일 HTML 파일이라 브라우저로 열기만 하면 됩니다.
예외는 두 가지입니다.

- **카피바라 온천 팡팡 / 마피아 게임** — React로 작성돼 있어서 `assets/`의 번들 파일을 씁니다. `src/`를 고쳤다면 `npm run build`로 다시 묶어주세요.
- **복셀 크래프트** — three.js를 cdnjs에서 불러오므로 인터넷 연결이 필요합니다.

## 로컬에서 보기

```bash
python -m http.server 8000
```

React 게임은 `file://`로 열면 브라우저 보안 정책에 걸릴 수 있으니 위처럼 서버로 띄우는 편이 확실합니다.

## 개발

```bash
npm install
npm run build
```

## 게임 추가하기

1. `games/` 안에 새 HTML 파일을 만듭니다. 자체 스타일을 쓰거나, 간단한 게임이면 `<link rel="stylesheet" href="../style.css">`로 공통 스타일을 씁니다.
2. 목록으로 돌아가는 `../index.html` 링크를 넣어주세요.
3. `index.html`의 알맞은 `.grid` 안에 카드 링크를 추가합니다.
4. main 브랜치에 push하면 GitHub Pages가 자동으로 반영합니다.
