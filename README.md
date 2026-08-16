# Minigames

브라우저에서 바로 즐기는 작은 게임 모음. 순수 HTML/CSS/JS로만 만들어서 빌드 과정이 없습니다.

**홈페이지:** https://yeseulhan00.github.io/minigames/

## 게임 목록

| 게임 | 설명 |
| --- | --- |
| [틱택토](games/tictactoe.html) | 미니맥스 AI와 겨루는 3목 두기 |
| [카드 짝 맞추기](games/memory.html) | 8쌍의 카드를 뒤집어 짝 찾기 |
| [반응 속도 테스트](games/reaction.html) | 초록색이 되면 최대한 빨리 클릭 |

## 로컬에서 보기

`index.html`을 브라우저로 열기만 하면 됩니다. 또는:

```bash
python -m http.server 8000
```

## 게임 추가하기

1. `games/` 안에 새 HTML 파일을 만들고 `<link rel="stylesheet" href="../style.css">`로 공통 스타일을 씁니다.
2. `index.html`의 `.grid` 안에 카드 링크를 하나 추가합니다.
3. main 브랜치에 push하면 GitHub Pages가 자동으로 반영합니다.
