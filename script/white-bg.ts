import sharp from "sharp";
import { writeFileSync } from "fs";

const files = [
  "client/public/images/nosso-quiz/masculino/rosto-sem-definicao.png",
  "client/public/images/nosso-quiz/masculino/papada-e-inchaco.png",
  "client/public/images/nosso-quiz/masculino/flacidez-facial.png",
  "client/public/images/nosso-quiz/masculino/maxilar-e-queixo.png",
  "client/public/images/nosso-quiz/masculino/bochechas-e-macas.png",
  "client/public/images/nosso-quiz/masculino/rugas-e-sulcos.png",
  "client/public/images/nosso-quiz/masculino/seu-mapa-facial-foi-gerado.png",
  "client/public/images/nosso-quiz/feminino/maxilar-e-queixo.png",
];

for (const file of files) {
  const buf = await sharp(file)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toBuffer();
  writeFileSync(file, buf);
  console.log("OK:", file);
}
