// React로 만든 게임을 브라우저에서 바로 실행되는 단일 JS 파일로 묶습니다.
// 결과물(assets/*.js)은 저장소에 커밋되므로 GitHub Pages에는 빌드 단계가 없습니다.
import * as esbuild from "esbuild";

const targets = [
  { entry: "src/capybara-pop.entry.jsx", out: "assets/capybara-pop.js" },
  { entry: "src/mafia.entry.jsx", out: "assets/mafia.js" },
];

for (const { entry, out } of targets) {
  await esbuild.build({
    entryPoints: [entry],
    outfile: out,
    bundle: true,
    minify: true,
    format: "iife",
    target: ["es2019"],
    // React는 번들 안에서 process.env.NODE_ENV를 참조하므로 반드시 치환해야 합니다.
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "info",
  });
}
