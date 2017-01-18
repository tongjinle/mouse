namespace Client{
    export class ScoreBoard{
        private sh:egret.SpriteSheet;
        sp:egret.Sprite;

        private animal:Animal;
        private isWin:boolean;
        constructor( animal:Animal,isWin:boolean){
            this.sh = RES.getRes('scoreBoard_png');
            this.sp = new egret.Sprite();

            this.sp.width = 600;


            this.animal = animal;
            this.isWin = isWin;

            this.creatScene();
            console.log('this.sp.width');
            console.log(this.sp.width);
        }

        private creatScene(){
            let ci = this.createCircle();
            ci.x = this.sp.width/2 - ci.width/2;
            this.sp.addChild(ci);

            let anim = this.createAnimal();
            anim.x = this.sp.width/2 - anim.width/2;
            anim.y = -90;
            this.sp.addChild(anim);

            let word = this.createWord();
            word.x = this.sp.width/2 - word.width/2;
            word.y = 130;
            this.sp.addChild(word);

        }

        private createAnimal(){
            return new egret.Bitmap(this.sh.getTexture(`${this.isWin?'w':'l'}_${this.animal == Animal.cat ? 'cat' : 'dog'}_png`));
        }

        private createCircle():egret.Bitmap{
            let bi = new egret.Bitmap(this.sh.getTexture(`${this.isWin?'w':'l'}_bg_png`));
            return bi;
        }

        private createWord(){
            return new egret.Bitmap(this.sh.getTexture(`${this.isWin?'w':'l'}_words_png`));
        }
    }
}