namespace Client{
    export class User{
        userId:string    ;
        username:string;
        logoUrl:string;
        scoreList:boolean[];
        role:Role;
        animal:Animal;
        status:UserStatus;

        face:egret.Bitmap;
        backFace:egret.Bitmap;

        private shCat:egret.SpriteSheet;
        private shDog:egret.SpriteSheet;

        constructor(userId:string,username:string,animal:Animal,role?:Role){
            this.shCat = RES.getRes('cat_png');
            this.shDog = RES.getRes('dog_png');

            
            this.userId = userId;
            this.username = username;
            this.animal = animal;
            this.scoreList =[];
            if(role!==undefined){
                this.resetRole(role);

                this.createFace();
            }


        }

        /**
        * 重置角色
        * 同时初始化角色所对应的状态    
        */
        resetRole(role:Role){
            this.role = role;
            if(Role.guesser==this.role  ){
                this.status = UserStatus.beforePutMouse;
            }else if(Role.roller==   this.role){
                this.status = UserStatus.beforeWatching;
            }
        }

        createFace(){
            let sh :egret.SpriteSheet;
            let an:string;
            if(this.animal ==Animal.cat){
                sh = this.shCat;
                an = 'cat';
            }else if(this.animal == Animal.dog){
                sh = this.shDog;
                an = 'dog';
            }

            this.face = new egret.Bitmap(sh.getTexture(`${an}_front_png`));
            this.backFace = new egret.Bitmap(sh.getTexture(`${an}_back_png`));
        }



    }
}