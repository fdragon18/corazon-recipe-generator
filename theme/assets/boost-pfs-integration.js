/** Please don't modify or unzip this content. It will be updated regularly **/
    (function() {
      BoostPFS.inject(this);

      //Set global variable
      Globals.hasIntegration = true;
      // 3rd app compile template
      Integration.compileIntegrationTemplate = function (data, itemHtml) {
        var itemReviewsHtml = '<span class="stamped-product-reviews-badge" data-id="' + data.id + '" data-product-title="' + data.title + '" data-product-sku="' + data.skus[0] + '"></span>';itemHtml = itemHtml.replace(/{{itemReviews}}/g, itemReviewsHtml);
        return itemHtml;
      };

      Integration.call3rdIntegrationFunc = function(data) {
        if (typeof StampedFn !== 'undefined' && typeof StampedFn.loadBadges == 'function') {  StampedFn.loadBadges();}
      }

    })();