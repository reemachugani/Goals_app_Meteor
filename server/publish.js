// focusareas -- {name: String, _id: String}
focusareas = new Meteor.Collection("focusareas");

// Publish complete set of focusareas to all clients.
Meteor.publish('focusareas', function () {
  return focusareas.find();
});


// goalitems -- {goal: String,
//				 fa_id: String(focusarea._id),
//				 tasks: [{task: String, done: boolean}, {...}, ...]}
goalitems = new Meteor.Collection("goalitems");

// Publish all items for requested fa_id.
Meteor.publish('goalitems', function (fa_id) {
  check(fa_id, String);
  return goalitems.find({fa_id: fa_id});
});
