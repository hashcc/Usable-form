$(function(){

  formAction.checkPattern();
  formAction.emailImitater();
  formAction.creditcardField();
  formAction.kanjiConverter();
  formAction.zipConverter();
  formAction.datePicker();
  
});


formAction = function (){};

// 必須入力項目の入力チェック
formAction.checkPattern = function(){
  
  $('[required]').on('keyup change', function(e){
    
    // パスワード確認は例外としてcheckConfirmPassword()
    if ($(this).attr("id") == "account_password_confirm"){
      var original = $('#account_password');
      checkConfirmPassword(original, $(this));
      return;
    }

    // メールアドレスはドコモ/auのRFC2822非準拠のものもチェックして警告
    if ($(this).attr("id") == "email"){
      $('#email').popover({
        placement: "top",
        title: "ご利用いただけません",
        content: "メールアドレスの国際ルールに沿ったアドレスではなく、お客様へのメールがうまく配信されない恐れがあるため、ご利用いただけません。@の前に.をつけないか、連続した.を使わないアドレスをご利用ください",
        trigger:   "manual"
      });

      if ((/\.@/.test($(this).val()) || /\.{2,}/.test($(this).val())) && /@(docomo|ezweb)/.test($(this).val())){
        $('#email').popover("show");
      }  else{
        $('#email').popover("hide");
      }
    }
    
    // 通常はcheckhoge()
    if (e.type == "keyup") checkInput($(this));
    if (e.type == "change") checkSelect($(this));

  });
  
  $('.required input[type="radio"]:radio').on('click onkeypress', function (e){
    checkRadio($(this));
  });

  $('.required input[type="checkbox"]:checkbox').on('click onkeypress', function (){
    checkCheckbox($(this));
  });

  // 入力チェック pattern属性があればtest()、なければ無条件OK
  var checkInput = function (elm){
    
    if (checkAttr(elm, "pattern")){
      var regex = new RegExp ("^"+elm.attr("pattern")+"$");
      if (regex.test(elm.val()) == true){
        setStatus(elm, "dealed");
      } else if(elm.val() == ""){
        setStatus(elm, "alert");
      } else{
        setStatus(elm, "caution");
      }
    } else{
      if (elm.val() != ""){
        setStatus(elm, "dealed");
      }
    }

  };

  var checkSelect = function (elm){
    setStatus(elm, "dealed");
  };
  
  var checkRadio = function (elm){
    setStatus(elm.parents(".required"), "dealed");
  };

  var checkCheckbox = function (elm){
    var checked = false;
    // チェックボックスのどれか1つにチェックが入っていればOK
    elm.parents(".required").find(".checkbox").each(function(){
      if ($(this).find("input").is(":checked")){
        setStatus(elm.parents(".required"), "dealed");
        checked = true;
      }
    });
    console.log(checked);
    if (checked == true) return;
    setStatus(elm.parents(".required"), "alert");
  };

  // パスワードが入力されたものと一致するか検証
  var checkConfirmPassword = function(original, confirm){
    
    if (confirm.val() == original.val()){
      setStatus(confirm, "dealed");
    } else if (confirm.val() == ""){
      setStatus(confirm, "alert");
    } else{
      setStatus(confirm, "caution");
    }
    
  };

};

// 必須入力項目が全て入力されているか確認して送信ボタンの有効/無効を切り替える
// 今のところ封印中
formAction.checkAllFieldFilled = function(){
  
  $("#submit").attr("disabled", "disabled");

  if (
      ($("[required]").length == $("[required].dealed").length) &&
      ($(".required").length == $(".required.dealed").length)
      ){
    $("#submit").removeAttr("disabled");
  }

};

// 確認用メールアドレスをインクリメンタルコピペ
formAction.emailImitater = function(){

  $('#email').on('keyup', function(){

    $("#email_confirm").parent().parent().removeClass("hide");
    $("#email_confirm").text($(this).val());

  });

};

// クレジットカード番号のフォーマット
formAction.creditcardField = function(){
  
  $("#creditcard").hide();
  $("#paymentMethod input:radio").on('click onkeypress', function(){
    if ($(this).val() == "option1"){
      $("#creditcard").show();
    } else{
      $("#creditcard").hide();
    }
  });

  $('.cc-number').payment('formatCardNumber');
  $('.cc-exp').payment('formatCardExpiry');
  $('.cc-csc').payment('formatCardCVC');
  $('[data-numeric]').payment('restrictNumeric');
  
  $('.cc-number').on('keyup', function(){
    var cardtype = $.payment.cardType($(this).val());

    if (cardtype){
      $(this).attr("data-cardtype", cardtype);
      $(this).css("background-image", 'url("img/card_'+ cardtype +'.png")');
    }

    if (cardtype == "amex"){
      $('.cc-csc')
        .attr("placeholder", "XXXX")
        .attr("maxlength", "4")
        .attr("pattern", "\d{4}");
    } else{
      $('.cc-csc')
        .attr("placeholder", "XXX")
        .attr("maxlength", "3")
        .attr("pattern", "\d{3}");
    }
    
  });

  $('.cc-csc').on("focus focusout", function(){
    $(this).popover({
    html: true,
    placement: "top",
    trigger: "manual",
    title: "記載場所",
    content: (($("#cc_number").attr("data-cardtype") == "amex") ? '<img src="./img/securitycode_amex.png" width="185" height="126" style="max-width: 100%;"><p>セキュリティコードはカード表面の番号右上に記載の数字4桁になります</p>' : '<img src="./img/securitycode_visa.png" width="185" height="126" style="max-width: 100%;"><p>セキュリティコードはカード裏面の署名欄に記載の数字末尾3桁になります</p>')
    }).popover("toggle");
  });

};


// 郵便番号入力後に住所に自動変換
formAction.zipConverter = function(){

  $('#zip').on('keyup', function(){

    AjaxZip2.zip2addr(this, pref, town);

  });

};

// 漢字 => よみがな変換
formAction.kanjiConverter = function(){

  var names = {
    kanji_family: "name_kanji_family",
    kanji_given : "name_kanji_given",
    yomi_family : "name_kana_family",
    yomi_given  : "name_kana_given"
  };


  // テキスト内容が変更されたらAPIに投げる
  $("#"+names["kanji_family"]+", #"+names["kanji_given"]).on("change", function(){
    
    // カナを投げられると何も返せない・・ぐぅ

    var id   = $(this).attr("id");    
    var attr = id.split("_")[2];
    var elm  = $("#"+names["yomi_"+attr]);
    
    // "かな"のみなら、そのまま挿入
    if (/^[ぁ-ん]*$/.test($(this).val()) == true){
      elm.val($(this).val());
    }

    $.ajax({
      url : "http://www.social-ime.com/api/",
      type: "GET",
      data: {
        string : $(this).val()
      },
      success: function(data){
        // 配列で返ってきます
        var yomis = $(data.responseText).text().trim().split(" ");
        // よみがなを抽出します
        var yomi  = substituteYomi(yomis);
        // 対応する欄に値を入れる
        elm.val(yomi);
        setStatus(elm, "dealed");
        return;
      }
    });

    // 配列からカタカナのみで構成された文字列を返す
    function substituteYomi(yomis){

      for (var i=0; i<yomis.length; i++){
        if (/^[ぁ-ん]*$/.test(yomis[i]) == true){
          return yomis[i];
        }
      }

    }

  });
  
};

// カレンダー呼び出し
formAction.datePicker = function(){
  
  var min = 2;  // 最短配達可能日（今日 + min）
  var max = 30; // 最長配達可能日（今日 + max）

  // <input type="date">をサポートしていれば、ネイティブ機能を利用
  // 未サポートであればフォールバックとしてjQuery UI DatePickerを利用 

  if (Modernizr.inputtypes.date) {
    
    $("#datepicker")
      .attr("value", moveDate(min))
      .attr("min",   moveDate(min))
      .attr("max",   moveDate(max));

  } else{

    var prefix  = "//ajax.googleapis.com/ajax/libs/jqueryui/1";
    
    // 動的にjQuery UIライブラリを読み込み

    $.getScript([prefix+"/jquery-ui.min.js", prefix+"/i18n/jquery.ui.datepicker-ja.min.js"],function(){
    
      // 読み込み完了したらdatepickerを起動
      $.datepicker.setDefaults($.datepicker.regional["ja"]);
      $("#datepicker").datepicker({
        "dateFormat": "yy-mm-dd", // YYYY-MM-DD
        "defaultDate": min,
        "minDate": min, 
        "maxDate": max,
        "firstDay": 1 // 月曜始まり
      });
    
    });

  }

};

// 内部関数：指定した日数分、今日から移動した日付を返す
function moveDate(move) {
  
  var d = new Date();
  d.setDate(d.getDate() + move);

  var f = {
    year : d.getFullYear(),
    mon  : ((d.getMonth() < 9) ? "0" : "") + (d.getMonth()+1),
    day  : ((d.getDate() < 10) ? "0" : "") + (d.getDate())
  };

  return f.year + "-" + f.mon + "-" + f.day;
  
}

// 内部関数：要素にステータスクラスを設定
function setStatus(elm, status){

  elm.removeClass("alert caution dealed");
  elm.addClass(status);
  return;

}

// 内部関数：属性存在確認
function checkAttr(elm, attr){

  return (typeof elm.attr(attr) !== 'undefined' && elm.attr(attr) !== false) ? true : false;

}

// 関数上書：複数のスクリプト読み込みに対応した$.getScript
var getScript = $.getScript;
$.getScript = function(url, fn){
  if (!$.isArray(url)) url = [url];
  $.when.apply(null, $.map(url, getScript)).done(function(){
    fn && fn();
  });
};