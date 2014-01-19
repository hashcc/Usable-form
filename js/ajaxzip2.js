/* ================================================================ *
    ajaxzip2.js ---- AjaxZip2 郵便番号→住所変換ライブラリ

    Copyright (c) 2006-2007 Kawasaki Yusuke <u-suke [at] kawa.net>
    http://www.kawa.net/works/ajax/ajaxzip2/ajaxzip2.html

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
* ================================================================ */

AjaxZip2 = function () {};
AjaxZip2.VERSION = '2.10';
AjaxZip2.JSONDATA = 'data';
AjaxZip2.CACHE = [];
AjaxZip2.prev = '';
AjaxZip2.PREFMAP = [
    null,       '北海道',   '青森県',   '岩手県',   '宮城県',
    '秋田県',   '山形県',   '福島県',   '茨城県',   '栃木県',
    '群馬県',   '埼玉県',   '千葉県',   '東京都',   '神奈川県',
    '新潟県',   '富山県',   '石川県',   '福井県',   '山梨県',
    '長野県',   '岐阜県',   '静岡県',   '愛知県',   '三重県',
    '滋賀県',   '京都府',   '大阪府',   '兵庫県',   '奈良県',
    '和歌山県', '鳥取県',   '島根県',   '岡山県',   '広島県',
    '山口県',   '徳島県',   '香川県',   '愛媛県',   '高知県',
    '福岡県',   '佐賀県',   '長崎県',   '熊本県',   '大分県',
    '宮崎県',   '鹿児島県', '沖縄県'
];

AjaxZip2.zip2addr = function ( azip1, apref, aaddr, azip2, astrt, aarea ) {
    var fzip1 = AjaxZip2.getElementByName(azip1);
    var fzip2 = AjaxZip2.getElementByName(azip2,fzip1);
    var fpref = AjaxZip2.getElementByName(apref,fzip1);
    var faddr = AjaxZip2.getElementByName(aaddr,fzip1);
    var fstrt = AjaxZip2.getElementByName(astrt,fzip1);
    var farea = AjaxZip2.getElementByName(aarea,fzip1);
    if ( ! fzip1 ) return;
    if ( ! fpref ) return;
    if ( ! faddr ) return;

    // 郵便番号を数字のみ7桁取り出す
    var vzip = fzip1.value;
    if ( fzip2 && fzip2.value ) vzip += fzip2.value;
    if ( ! vzip ) return;
    var nzip = '';
    for( var i=0; i<vzip.length; i++ ) {
        var chr = vzip.charCodeAt(i);
        if ( chr < 48 ) continue;
        if ( chr > 57 ) continue;
        nzip += vzip.charAt(i);
    }
    if ( nzip.length < 7 ) return;

    // 前回と同じ値＆フォームならキャンセル
    var uniq = nzip+fzip1.name+fpref.name+faddr.name;
    if ( fzip1.form ) uniq += fzip1.form.id+fzip1.form.name+fzip1.form.action;
    if ( fzip2 ) uniq += fzip2.name;
    if ( fstrt ) uniq += fstrt.name;
    if ( uniq == AjaxZip2.prev ) return;
    AjaxZip2.prev = uniq;

    // JSON取得後のコールバック関数
    var func1 = function ( data ) {

        var array = data[nzip];
        // Opera バグ対策：0x00800000 を超える添字は +0xff000000 されてしまう
        var opera = (nzip-0+0xff000000)+"";
        if ( ! array && data[opera] ) array = data[opera];
        
        if ( ! array ){
          $('#zip').tooltip({
            placement: "top",
            title:     "郵便番号に合致する住所が見つけられませんでした、手動でご入力ください",
            trigger:   "manual"
          }).tooltip('show');
          return;
        }

        var pref_id = array[0];                 // 都道府県ID
        if ( ! pref_id ) return;
        var jpref = AjaxZip2.PREFMAP[pref_id];  // 都道府県名
        if ( ! jpref ) return;
        var jcity = array[1];
        if ( ! jcity ) jcity = '';              // 市区町村名
        var jarea = array[2];
        if ( ! jarea ) jarea = '';              // 町域名
        var jstrt = array[3];
        if ( ! jstrt ) jstrt = '';              // 番地

        var cursor = faddr;
        var jaddr = jcity;                      // 市区町村名

        if ( fpref.type == 'select-one' || fpref.type == 'select-multiple' ) {
            // 都道府県プルダウンの場合
            var opts = fpref.options;
            for( var i=0; i<opts.length; i++ ) {
                var vpref = opts[i].value;
                var tpref = opts[i].text;
                opts[i].selected = ( vpref == pref_id || vpref == jpref || tpref == jpref );
            }
        } else {
            if ( fpref.name == faddr.name ) {
                // 都道府県名＋市区町村名＋町域名合体の場合
                jaddr = jpref + jaddr;
            } else {
                // 都道府県名テキスト入力の場合
                fpref.value = jpref;
            }
        }
        if ( farea ) {
            cursor = farea;
            farea.value = jarea;
        } else {
            jaddr += jarea;
        }
        if ( fstrt ) {
            cursor = fstrt;
            if ( faddr.name == fstrt.name ) {
                // 市区町村名＋町域名＋番地合体の場合
                jaddr = jaddr + jstrt;
            } else if ( jstrt ) {
                // 番地テキスト入力欄がある場合
                fstrt.value = jstrt;
            }
        }
        faddr.value = jaddr;

        // patch from http://iwa-ya.sakura.ne.jp/blog/2006/10/20/050037
        // update http://www.kawa.net/works/ajax/ajaxzip2/ajaxzip2.html#com-2006-12-15T04:41:22Z
        if ( ! cursor ) return;
        if ( ! cursor.value ) return;
        var len = cursor.value.length;
        cursor.focus();
        if ( cursor.createTextRange ) {
            var range = cursor.createTextRange();
            range.move('character', len);
            range.select();
        } else if (cursor.setSelectionRange) {
            cursor.setSelectionRange(len,len);
        }
        
        // patched by hashcc (@hashcc)
        $(aaddr).addClass("caution");
        $(apref).addClass("dealed");
        if ($("#address_caution").size() == 0){
          $(aaddr).after('<span class="help-block" id="address_caution">住所の続きを入力してください</span>');
        }

    };

    // 郵便番号上位3桁でキャッシュデータを確認
    var zip3 = nzip.substr(0,3);
    var data = AjaxZip2.CACHE[zip3];
    if ( data ) return func1( data );

    // JSONファイルを受信する
    var url = AjaxZip2.JSONDATA+'/zip-'+zip3+'.json';

    if ( window.jQuery ) {
        // JSONファイル受信後のコールバック関数（jQuery用）
        var func3 = function (data) {
            if ( ! data ) return;
            AjaxZip2.CACHE[zip3] = data;
            func1( data );
        };
        jQuery.getJSON( url, func3 );
    }
};

// Safari 文字化け対応
// http://kawa.at.webry.info/200511/article_9.html
AjaxZip2.getResponseText = function ( req ) {
    var text = req.responseText;
    if ( navigator.appVersion.indexOf('KHTML') > -1 ) {
        var esc = escape( text );
        if ( esc.indexOf('%u') < 0 && esc.indexOf('%') > -1 ) {
            text = decodeURIComponent( esc );
        }
    }
    return text;
}

// フォームnameから要素を取り出す
AjaxZip2.getElementByName = function ( elem, sibling ) {
    if ( typeof(elem) == 'string' ) {
        var list = document.getElementsByName(elem);
        if ( ! list ) return null;
        if ( list.length > 1 && sibling && sibling.form ) {
            var form = sibling.form.elements;
            for( var i=0; i<form.length; i++ ) {
                if ( form[i].name == elem ) {
                    return form[i];
                }
            }
        } else {
            return list[0];
        }
    }
    return elem;
}
