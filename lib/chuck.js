exports.log = function(scope, properties) {
  var self = this;
  setTimeout(function() {
    self.send({
      scope: scope,
      properties: properties
    });
  }, 250);
};

exports.send = function() {

};
