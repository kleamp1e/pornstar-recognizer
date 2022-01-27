# pornstar-recognizer

## 概要

日本のAV女優を画像から検索するためのツールです。

1,000人、5,000枚の顔情報が登録されています。（2022年1月28日現在）

## ビルド方法 & 起動方法

```sh
cd ~/repo/github.com/kleamp1e/pornstar-recognizer/
docker-compose build
docker-compose up -d
```

## 使用方法

```sh
# 検索対象の画像を取得します。
wget https://pics.dmm.co.jp/mono/actjpgs/hatano_yui.jpg

# 顔認識します。
curl -X POST \
  --header "Content-Type: multipart/form-data" \
  --form "file=@hatano_yui.jpg;type=image/jpeg" \
  http://localhost:8001/detect \
  > hatano_yui.json

# 顔認識した結果から顔特徴量を抽出します。
jq "{embedding: .response.faces[0].embedding}" \
  < hatano_yui.json \
  > hatano_yui_embedding.json

# 顔特徴量からAV女優を検索します。
curl -X POST \
  --header "Content-Type: application/json" \
  --data-binary @hatano_yui_embedding.json \
  http://localhost:8001/recognize
```

## ライセンス

`db`ディレクトリを除くソースコードなどはMITライセンスです。
`db`ディレクトリのデータベースはMITライセンスではありませんのでご注意ください。

## 参考

本ツールの実装にあたり、[Yuya Kato](https://zenn.dev/yuyakato)さんの以下の記事を参考にしました。分かりやすい記事をありがとうございます。

* [InsightFaceとFastAPIで顔検出サーバを作ってみた](https://zenn.dev/yuyakato/articles/6a1d8177901381)
* [InsightFaceの顔検出結果をNext.jsで可視化してみた](https://zenn.dev/yuyakato/articles/e96b9d8ec289cc)
* [InsightFaceで顔認証（特徴量抽出、比較）してみた](https://zenn.dev/yuyakato/articles/d35b185d36a33b)
* [InsightFaceをGPUで動かしてみた](https://zenn.dev/yuyakato/articles/c780a08c8385e7)

その他、以下の記事を参考にしました。

* [ディープラーニングで「顔が似ているAV女優を教えてくれるbot」を構築 - Qiita](https://qiita.com/tmnck/items/af82deb04d432f1f4f6e)
* [chainerによるディープラーニングでAV女優の類似画像検索サービスをつくったノウハウを公開する - Qiita](https://qiita.com/xolmon/items/0b82f4861cf93fd28e33)
* [Facenetを使った類似AV女優検索 - Qiita](https://qiita.com/zeze/items/1cec8c75833c853b5074)
