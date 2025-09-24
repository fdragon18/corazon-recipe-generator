$(function(){
  $('.secList').on('click',function(){
    $('.secList').removeClass('irokae'); //一旦すべて削除
    $(this).addClass('irokae'); //クリックされたものだけセット
    // クリックした要素の ID と違うクラス名のセクションを非表示
    $('dl').not($('.'+$(this).attr('id'))).hide();
    // クリックした要素の ID と同じクラスのセクションを表示
    $('.'+$(this).attr('id')).fadeIn(1000);
    // toggle にすると、同じボタンを 2 回押すと非表示になる
    // $('.'+$(this).attr('id')).toggle();
  });
});