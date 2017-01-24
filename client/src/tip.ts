namespace Client {
    export class Tip {
        sp:egret.Sprite;
        private tx: egret.TextField;
        private bg:egret.Bitmap;
        constructor() {
            this.createSp();
        }

        private createSp(){
            let sp = this.sp = new egret.Sprite();
            let texture:egret.Texture = RES.getRes('talkBox_png');
            window['tt'] = texture;
            window['sg'] = texture['scale9Grid'];
            console.log(texture);
            let bg = this.bg = new egret.Bitmap(texture);
            bg.scale9Grid = texture['scale9Grid'];
            bg.width=200;
 
            let tx = this.tx = new egret.TextField();
            tx.size = 38;
            tx.textColor = 0x000000;
            tx.x =20;
            tx.y=25;

            sp.addChild(bg);
            sp.addChild(tx);
            sp.height = bg.height;
            sp.visible = false;
        }

        showMsg(msg: string, duration: number, next: () => void) {
            let sp = this.sp;
            let bg = this.bg;
            let tx = this.tx;

            let perLetterWidth = 45;
            bg.width = perLetterWidth* msg.length;
            sp.width = bg.width;
            sp.visible = true;

            tx.text = msg;
            tx.textAlign = egret.HorizontalAlign.CENTER;
            tx.verticalAlign = egret.VerticalAlign.MIDDLE;

            egret.Tween.get(sp)
                .to({ /*y:0*/ },duration)
                .call(() => {
                    sp.visible = false;
                    next();
                });
        }
    }
}