focusareas = new Meteor.Collection("focusareas");
goalitems = new Meteor.Collection("goalitems");

Session.set('user_signed_in', false);

Session.set('adding_focusarea', false);

Session.setDefault("fa_id", null);

Session.set("selected_goal_id", null);

// Subscribe to 'focusareas' collection on startup.
// Select a focusarea once data has arrived.
var faHandle = Meteor.subscribe('focusareas', function () {
  if (!Session.get('fa_id')) {
    var fa = focusareas.findOne({}, {sort: {name: 1}});
    if (fa)
      Router.setFA(fa._id);
  }
});

var goalsHandle = null;
// Always be subscribed to the goalItems for the selected focusarea.
Deps.autorun(function () {
  var fa_id = Session.get('fa_id');
  if (fa_id)
    goalsHandle = Meteor.subscribe('goalitems', fa_id);
  else
    goalsHandle = null;
});

// Check if user signed in. Display changes accordingly.
Deps.autorun(function(){
  if(Meteor.userId()){
    Session.set('user_signed_in', true);
  }
  else{
    Session.set('user_signed_in', false); 
  }
});
Deps.flush();

Template.content.signed_in = function() {
  return Session.equals('user_signed_in', true);
};

//////// Focus Areas /////////

Template.focusareas.loading = function() {
  return !faHandle.ready();
};

Template.focusareas.entries = function() {
  return focusareas.find({}, {sort: {name:1}});
};

Template.focusareas.new_fa = function(){
  return Session.equals('adding_focusarea', true);
};

Template.focusareas.current_fa = function(){
  return focusareas.findOne(Session.get('fa_id'));
};

Template.focusareas.events({
    'mousedown .focusarea': function(e){
      Router.setFA(this._id);
    },
   'click #btnNewFa': function (e, t) {
     Session.set('adding_focusarea', true);
     Meteor.flush();
     focusText(t.find("#add-fa"));
   },
   'keyup #add-fa': function (e,t){
      if (e.which === 13){
        var faVal = String(e.target.value || "");
        if (faVal)
        {
          focusareas.insert({_id:(faVal.toLowerCase().replace(/ /g, '')) , name:faVal});
          Session.set('adding_focusarea', false);
        }
      }
    },
    'focusout #add-fa': function(e,t){
      Session.set('adding_focusarea',false);
    }
});

///////// Goals //////////

Template.goalitems.loading = function() {
  return goalsHandle && !goalsHandle.ready();
};

Template.goalitems.any_fa_selected = function() {
  return !Session.equals('fa_id', null);
};

Template.goalitems.goals = function(){
  //goals displayed based on fa_id

  var fa_id = Session.get('fa_id');
  if(!fa_id)
    return {};

  var sel = {fa_id: fa_id};

  return goalitems.find(sel);
};

Template.goalitems.events({
    'click .goal-header': function(e, t){
      Session.set("selected_goal_id", this._id);
}
});


///////// Task List //////////

Template.tasklist.done_checkbox = function(){
  return this.done ? 'checked' : '';
};

Template.tasklist.events({
  'click .check': function () {

    var goal_id = Session.get('selected_goal_id');
    var sel = goalitems.findOne({_id: goal_id, "tasks.task": this.task});

    if (sel && sel.tasks)
      {
        for (var i = 0; i<sel.tasks.length; i++)
          {
          if (sel.tasks[i].task === this.task)
            {
              sel.tasks[i].done = !this.done;
            }
          }
        goalitems.update(goal_id,{$set:{"tasks":sel.tasks}});
      }
  }
});

/////Generic Helper Functions/////

//this function puts our cursor where it needs to be.
function focusText(i) {
  i.focus();
  i.select();
};

////////// Tracking selected list in URL //////////

var FARouter = Backbone.Router.extend({
  routes: {
    ":fa_id": "main"
  },
  main: function (fa_id) {
    var oldList = Session.get("fa_id");
    if (oldList !== fa_id) {
      Session.set("fa_id", fa_id);
      Session.set("selected_goal_id", null);
    }
  },
  setFA: function (fa_id) {
    this.navigate(fa_id, true);
  }
});

Router = new FARouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});

