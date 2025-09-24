// Override Settings
var boostPFSInstantSearchConfig = {
  search: {
    //suggestionMode: 'test',
    //suggestionPosition: 'left'
    //suggestionMobileStyle: 'style2'
  }
};

(function () {
  /* This is to inject boost components into this scope, so we can override component's function */
  BoostPFS.inject(this);

  // Customize style of Suggestion box
  SearchInput.prototype.customizeInstantSearch = function() {};
})();