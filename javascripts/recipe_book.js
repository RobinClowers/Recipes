function RecipeBook() {
  var self = this;

  this.init = function() {
    var filePath = document.location.href;
    filePath = $.twFile.convertUriToLocalPath(filePath);
    filePath = filePath.replace(/index.html/, '');
    self.filePath = filePath + 'data.json';
    load();
  };

  this.changeRecipe = function(id) {
    console.log(id);
    if(id == 0) {
      clearForm();
      return;
    }
    self.recipe = getRecipe(id);
    console.log(self.recipe);
    $('#recipe-list').val(id);
    $('#title').val(self.recipe.title);
    $('#description').val(self.recipe.description);
    $('#tags').val(self.recipe.tags.join(', '));
  }

  this.filterRecipes = function(tag) {
    console.log('filtering by: ' + tag);
    if(tag == '') {
      self.tagFilter = ''
    }
    self.tagFilter = tag;
    bindList();
  }

  this.changeTagGroup = function(tag) {
    bindCurrentTagGroup();
  }

  this.saveRecipe = function() {
    if(isNewRecipe()) { self.recipes.push(self.recipe); }
    updateRecipe(self.recipe);
    save();
    bindList();
    bindTags();
    changeRecipe(self.recipe.id);
  }

  this.addTagGroup = function() {
    var group = {
      name: $('#new-tag-group').val(),
      tags: []
    };
    self.tagGroups.push(group);
    save();
    bindTagGroups();
  };

  function clearForm() {
    $('#title').val('');
    $('#description').val('');
    $('#tags').val('');
  }

  function currentId() {
    var id = parseInt($('#recipe-list').val());
    return id == 0;
  }

  function isNewRecipe() {
    var id = parseInt($('#recipe-list').val());
    return id == 0;
  }

  function newRecipe() {
    self.recipe = {
      id: getNextId(),
      name: '',
      description: '',
      tags: []
    };
  }

  function getRecipe(id) {
    return _.find(self.recipes, function(recipe) {
      return recipe.id == id
    });
  }

  function updateRecipe(recipe) {
    recipe.title = $('#title').val(),
    recipe.description = $('#description').val(),
    recipe.tags = buildTags()
  }

  function buildTags() {
    var list = $('#tags').val().split(',');
    return $.map(list, function (item, index) {
      if(item == '') { return null; }
      return item.trim();
    });
  }

  function getNextId() {
    if(self.recipes.length == 0) {
      return 1;
    }
    return self.recipes[self.recipes.length -1].id + 1;
  }

  function load() {
    fileContents = $.twFile.load(self.filePath)
    console.log('file contents: ' + fileContents);
    if(fileContents) {
      var data = JSON.parse(fileContents);
      self.recipes = data.recipes;
      self.tagGroups = data.tagGroups;
    } else {
      self.recipes = [];
      self.tagGroups = [];
    }
    console.log(self.recipes);
    newRecipe();
    buildTagIndex();
    bindTags();
    bindList();
    bindTagGroups();
    bindUngroupedTags();
    bindCurrentTagGroup();
    initializeTagGroups();
  }

  function buildTagIndex() {
    self.tags = [];
    $.each(self.recipes, function(index, recipe) {
      $.each(recipe.tags, function(tagIndex, tag) {
        if(!_.include(self.tags, tag)) { self.tags.push(tag); }
      });
    });
  }

  function bindTags() {
    buildTagIndex();
    var list = $('#tag-list');
    list.find('option').remove();
    list.append($('<option />').val('').text('All'));
    $.each(self.tags, function(index, tag) {
      list.append($('<option />').val(tag).text(tag));
    });
  }

  function isFilterSet() {
    return typeof(self.tagFilter) != 'undefined' && self.tagFilter != '';
  }

  function bindList() {
    var list = $('#recipe-list');
    clearForm();
    list.find('option').remove();
    list.append($('<option />').val(0).text('New Recipe'));
    list.val(0);
    var noFilter = !isFilterSet();
    var tagFilter = self.tagFilter;
    $.each(self.recipes, function() {
      if(noFilter || _.include(this.tags, tagFilter)) {
        list.append($('<option />').val(this.id).text(this.title));
      }
    });
  }

  function bindTagGroups() {
    var groups = $('#tag-groups');
    groups.find('option').remove();
    $.each(self.tagGroups, function() {
      groups.append($('<option />').val(this.name).text(this.name));
    });
    groups.children().first().attr('selected', true);
  }

  function bindCurrentTagGroup() {
    var group = currentTagGroup();
    var tagList = $('#current-tag-group');
    tagList.find('li').remove();
    _.each(self.tags, function(tag) {
      if(_.include(group.tags, tag)) {
        tagList.append('<li>' + tag + '</li>');
      }
    });
  }

  function bindUngroupedTags() {
    var group = currentTagGroup();
    var tagList = $('#ungrouped-tags');
    tagList.find('li').remove();
    _.each(self.tags, function(tag) {
      if(!_.include(group.tags, tag)) {
        tagList.append('<li>' + tag + '</li>');
      }
    });
  }

  function initializeTagGroups() {
    $('.draggable li').draggable();
    $('.draggable').droppable({
      drop: dropTag
    });
  }

  function dropTag(event, ui) {
    var newTag = $(ui.draggable)
      .remove()
      .clone()
      .removeAttr('style')
      .draggable();
    $(this).append(newTag);
    var currentGroup = currentTagGroup();
    currentGroup.tags.push(newTag.text());
    save();
  }

  function currentTagGroup() {
    var groupName = $('#tag-groups option:selected').text();
    var currentGroup = _.find(self.tagGroups, function(group) {
      return group.name == groupName;
    });
    return currentGroup;
  }

  function save() {
    var data = {
      recipes : self.recipes,
      tagGroups : self.tagGroups
    };
    var jsonData = JSON.stringify(data, null, 2);
    $.twFile.save(self.filePath, jsonData)
  }
}
