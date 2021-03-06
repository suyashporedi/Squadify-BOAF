const Post = require("../models/post");
const Group = require("../models/group");
const formidable = require("formidable");
const fs = require("fs");
const _ = require("lodash");
const User = require("../models/user");

exports.postById = (req, res, next, id) => {
  Post.findById(id)
    .populate("postedBy", "_id name")
    .populate("comments.postedBy", "_id name")
    // .select("_id title body created likes comments photo group")
    .exec((err, post) => {
      if (err || !post) {
        return res.status(400).json({
          error: err
        });
      }
      req.post = post;
      next();
    });
};
// exports.postById = (req, res, next, id) => {
//   Post.findById(id)
//       .populate('postedBy', '_id name')
//       .populate('comments.postedBy', '_id name')
//       .populate('postedBy', '_id name role')
//       .select('_id title body created likes comments photo')
//       .exec((err, post) => {
//           if (err || !post) {
//               return res.status(400).json({
//                   error: err
//               });
//           }
//           req.post = post;
//           next();
//       });
// };

// exports.getPosts = (req, res) => {
//   const posts = Post.find()
//     .populate("postedBy", "_id name")
//     .populate('comments', 'text created')
//     .populate('comments.postedBy', '_id name')
//     .select("_id title body created likes")
//     .sort({ created: -1 })
//     .then(posts => {
//       res.json(posts);
//     })
//     .catch(err => console.log(err));
// };

exports.postsByGroup = (req, res) => {
  Post.find({ group: req.group._id })
    .populate("postedBy", "_id name")
    .select("_id title body created comments likes")
    .sort("_created")
    .exec((err, posts) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      }
      res.json(posts);
    });
};

exports.createPost = (req, res, next) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded"
      });
    }
    let post = new Post(fields);

    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;

    post.postedBy = req.profile;
    post.group = req.group;
    if (files.photo) {
      post.photo.data = fs.readFileSync(files.photo.path);
      post.photo.contentType = files.photo.type;
    }

    // Push this post to corresponding group
    Group.findByIdAndUpdate(
      req.group._id,
      { $push: { posts: post._id } },
      { new: true }
    ).exec((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      } else {
        console.log(`Post ${post._id} pushed to its group`);
        // res.json(result);
        // res.json({
        //   group: result
        // });
      }
    });

    post.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      }
      res.json(result);
    });
  });

  // this part will be deleted later
  // const post = new Post(req.body);
  // post.save().then(result => {
  //   // Push this post to corresponding group
  //   res.status(200).json({
  //     post: result
  //   });
  // });
};

exports.postsByUser = (req, res) => {
  Post.find({ postedBy: req.profile._id })
    .populate("postedBy", "_id name")
    .select("_id title body created likes")
    .sort("_created")
    .exec((err, posts) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      }
      res.json(posts);
    });
};

global.postList = [];

function putPosts(group){
  //console.log("select group: ",group);
  posts = Post.find({ group: group}).populate("postedBy", "_id name",).populate("group", "_id name").select("_id title body created likes")
  .sort("_created").exec(function(err, psts){
    //console.log("Getting Posts",psts)
    for( var i =0; i< psts.length; i++)
      postList.push(psts[i]);
      //console.log("Posting", postList)
  });
}

exports.postsByUserGroup = (req, res) => {
  User.find({ _id: req.profile._id })
    .select('groups')
    .exec((err, groups) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      }
      for(var i = 0; i < groups[0].groups.length; i++){
        //console.log(i, groups[0].groups.length);
        putPosts(groups[0].groups[i]);
      }
      //console.log("Groups of user",groups)
    });
    //console.log("Posts of group:", postList)
    res.json(postList).then(postList.length = 0);;
};

exports.isPoster = (req, res, next) => {
  let isPoster = req.post && req.auth && req.post.postedBy._id == req.auth._id;
  if (!isPoster) {
    return res.status(403).json({
      error: "User is not authorized"
    });
  }
  next();
};

exports.updatePost = (req, res, next) => {
  let post = req.post;
  post = _.extend(post, req.body);
  post.updated = Date.now();
  post.save(err => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json(post);
  });
};

exports.deletePost = (req, res) => {
  let post = req.post;
  let group = post.group;

  // remove the post from it's group's "posts" field
  Group.findByIdAndUpdate(
    group, // group id stored in post
    { $pull: { posts: post._id } },
    { new: true }
  ).exec((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    } else {
      console.log(`Post ${post._id} deleted from group ${group}`);
    }
  });

  post.remove((err, post) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json({
      message: "Post deleted succesfully"
    });
  });
};

// Because postById will execute everytime when postId is in the params. So post is already in req
exports.singlePost = (req, res) => {
  return res.json(req.post);
};

exports.photo = (req, res, next) => {
  res.set("Content-Type", req.post.photo.contentType);
  return res.send(req.post.photo.data);
};

exports.updatePost = (req, res, next) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Photo could not be uploaded."
      });
    }

    // save post
    let post = req.post;
    // Override user with new fields
    post = _.extend(post, fields);
    post.updated = Date.now();
    if (files.photo) {
      post.photo.data = fs.readFileSync(files.photo.path);
      post.photo.contentType = files.photo.type;
    }

    post.save((err, reuslt) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      }

      return res.json(post);
    });
  });
};

exports.like = (req, res) => {
  Post.findByIdAndUpdate(
    req.body.postId,
    { $push: { likes: req.body.userId } },
    { new: true } // required by Mongoose
  ).exec((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    } else {
      res.json(result);
    }
  });
};

exports.unlike = (req, res) => {
  Post.findByIdAndUpdate(
    req.body.postId,
    { $pull: { likes: req.body.userId } },
    { new: true } // required by Mongoose
  ).exec((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    } else {
      res.json(result);
    }
  });
};

exports.comment = (req, res) => {
  let comment = req.body.comment;
  comment.postedBy = req.body.userId;

  Post.findByIdAndUpdate(
    req.body.postId,
    { $push: { comments: comment } },
    { new: true }
  )
    .populate("comments.postedBy", "_id name")
    .populate("postedBy", "_id name")
    .exec((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      } else {
        res.json(result);
      }
    });
};

exports.uncomment = (req, res) => {
  let comment = req.body.comment;

  Post.findByIdAndUpdate(
    req.body.postId,
    { $pull: { comments: { _id: comment._id } } },
    { new: true }
  )
    .populate("comments.postedBy", "_id name")
    .populate("postedBy", "_id name")
    .exec((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      } else {
        res.json(result);
      }
    });
};

exports.findGroupIdOfPost = (req, res) => {
  Post.find({ _id: req.post._id })
    .select("group")
    .exec((err, post) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      }
      res.json(post);
    });
};
