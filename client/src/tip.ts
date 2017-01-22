namespace Client {
    export class Tip {
        tx: egret.TextField;
        private bg:egret.Bitmap;
        constructor() {
            let tx = this.tx = new egret.TextField();
            tx.textAlign = egret.HorizontalAlign.CENTER;
            tx.visible = false;
        }

        showMsg(msg: string, duration: number, next: () => void) {
            let tx = this.tx;
            tx.text = msg;
            tx.size = 38;
            tx.scaleY = 1;
            tx.visible = true;

            egret.Tween.get(tx)
                .to({ scaleY: .1 },duration)
                .call(() => {
                    tx.visible = false;
                    next();
                });
        }
    }
}