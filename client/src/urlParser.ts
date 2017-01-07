namespace Client {
    export class UrlParser {
        static parseSearch(search: string): UserParam {
            let us: Client.UserParam;
            let params = {};
            search.slice(1).split('&').forEach(str => {
                let arr = str.split('=');
                let key = arr[0] as string;
                let value = arr[1] as string;
                if (/^ext_/.test(key)) {
                    let ext = params['ext'] = params['ext'] || {};
                    ext[key.replace(/^ext_/, '')] = value;
                } else {
                    params[arr[0]] = arr[1];

                }
            });
            // console.log(params);
            us = params as Client.UserParam;
            return us;

        }
    }
}