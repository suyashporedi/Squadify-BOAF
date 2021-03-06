import React, { Component } from "react";
import { singleGroup, remove, joinGroup, unjoinGroup } from "./apiGroup";
import { listEventByGroup } from "../event/apiEvent";
import { list } from "../post/apiPost";
import { Link, Redirect } from "react-router-dom";
import DefaultPost from "../images/tea.png";
import { isAuthenticated } from "../auth";
import { MdLocationOn } from "react-icons/md";
import { TiTags } from "react-icons/ti";
import { IoMdPeople } from "react-icons/io";
import { MdPersonOutline } from "react-icons/md";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Menu from "../core/Menu";

class GroupPosts extends Component {
  state = {
    group: "",
    redirectToGroups: false,
    redirectToSignin: false,
    joined: false,
    members: [],
    tags: [],
    events: [],
    group_events: [],
    group_posts: []
  };

  updateMembers = members => {
    this.setState({ members });
  };

  updateTags = tags => {
    this.setState({ tags });
  };

  joinToggle = () => {
    if (!isAuthenticated()) {
      this.setState({ redirectToSignin: true });
      return false;
    }

    const userId = isAuthenticated().user._id;
    const token = isAuthenticated().token;
    const groupId = this.state.group._id;

    let callApi = this.state.joined ? unjoinGroup : joinGroup; // call unlike/like method accordingly
    callApi(userId, token, groupId).then(data => {
      if (data.error) {
        console.log(data.error);
      } else {
        this.setState({
          joined: !this.state.joined,
          members: data.members,
          tags: data.tags
        });
      }
    });
  };

  // Check if the user exists in the likes array or not. If exists, return true, else return false
  checkJoined = members => {
    const userId = isAuthenticated() && isAuthenticated().user._id;
    let match = members.indexOf(userId) !== -1; // if this user exists in the members array, then its index is not -1, return true; else return false
    return match;
  };

  deleteGroup = () => {
    // const groupId = this.props.groupId;
    const groupId = this.props.match.params.groupId;
    const token = isAuthenticated().token;
    remove(groupId, token).then(data => {
      if (data.error) {
        console.log(data.error);
      } else {
        this.setState({ redirectToGroups: true });
      }
    });
  };

  deleteConfirmed = () => {
    let answer = window.confirm("Are you sure to delete this group?");
    if (answer) {
      this.deleteGroup();
    }
  };

  componentDidMount = () => {
    const groupId = this.props.match.params.groupId;
    const token = isAuthenticated().token;
    singleGroup(groupId).then(data => {
      if (data.error) {
        console.log(data.error);
      } else {
        this.setState({
          group: data,
          members: data.members,
          tags: data.tags,
          joined: this.checkJoined(data.members)
          //   comments: data.comments
        });
      }
    });
    listEventByGroup(groupId, token).then(data => {
      if (data.error) {
        console.log(data.error);
      } else {
        this.setState({
          group_events: data
        });
      }
    });
    list(groupId).then(data => {
      if (data.error) {
        console.log(data.error);
      } else {
        this.setState({ group_posts: data });
      }
    });
  };

  //   renderEvents = group_events =>{
  //     return(
  //       <div>
  //         <h4 className="display-4 mt-3 ml-3"> <small class="text-muted">Events:</small></h4>
  //     {group_events.map((event,i)=>{
  //       return(
  //         <div className='col-md-4 col-xs-6 mb-2' key={i}>
  //                 <div class='card bwm-card'>

  //                   <div class='card-block'>
  //                     <h4 class='card-title'>{event.name}</h4>
  //                     <h6 class='card-subtitle mb-4 text-muted'>{event.description.substring(0, 100)}</h6>
  //                     <p class='card-text'>Event <Link to={`${event.creatorId}`}>{event.createdBy._id} </Link>
  //                      on {new Date(event.eventdate).toDateString()} </p>
  //                      <p class='card-text'>Timings  {new Date(event.starttime).getHours()} : {new Date(event.starttime).getMinutes()}  to
  //                          {new Date(event.endtime).getHours()} : {new Date(event.endtime).getMinutes()} </p>
  //                   </div>
  //                   <Link
  //                      to={`/event/${event._id}`}
  //                      className="btn btn-raised btn-info btn-sm text-center"
  //                    >
  //                      Explore Event
  //                    </Link>
  //                 </div>
  //             </div>
  //       );
  //     })}
  //     </div>
  //     );
  //  };

  renderPosts = group_posts => {
    if (group_posts.length == false) {
      const groupId = this.state.group._id;
      const { joined, members } = this.state;
      return (
        <div>
          {joined ? (
            <div>
              <br />
              <div>Psst! Create a new post ASAP!</div>
              <br />
              <Link
                to={`/group/${groupId}/post/create`}
                className="btn btn-raised btn-info btn-sm"
              >
                Create Post
              </Link>
            </div>
          ) : (
            <div>
              <br />
              Sorry, the group folks haven't created a post yet! :(
            </div>
          )}
        </div>
      );
    } else {
      const groupId = this.state.group._id;
      const { joined, members } = this.state;
      return (
        <div>
          {joined ? (
            <div>
              <br />
              <Link
                to={`/group/${groupId}/post/create`}
                className="btn btn-raised btn-info btn-sm"
              >
                Create Post
              </Link>
            </div>
          ) : (
            <div></div>
          )}
          <br />
          {/* <h4 className="display-4 mt-3"> <small class="text-muted">Posts:</small></h4> */}
          {/* <Link
            to={`/group/${groupId}/post/create`}
            className="btn btn-raised btn-info btn-sm mr-2"
          >
            Create a post
          </Link> */}

          <div className="row">
            {group_posts.map((post, i) => {
              const posterId = post.postedBy ? `/user/{post.postedBy._id}` : "";
              const posterName = post.postedBy
                ? post.postedBy.name
                : " Unknown";

              return (
                <div className="col-md-4 col-xs-6 mb-2" key={i}>
                  <div class="card bwm-card">
                    <img
                      src={`${process.env.REACT_APP_API_URL}/post/photo/${post._id}`}
                      alt={post.title}
                      onError={i => (i.target.src = `${DefaultPost}`)}
                      className="img-thumbnail mb-3"
                      style={{ height: "200px", width: "350px" }}
                    />

                    <div class="card-block" style={{ height: "28vh" }}>
                      <h6 class="card-subtitle">{post.title}</h6>
                      <h4 class="card-title">{post.body.substring(0, 100)}</h4>
                      <p class="card-text">
                        Possted by <Link to={`${posterId}`}>{posterName} </Link>
                        on {new Date(post.created).toDateString()}
                      </p>
                    </div>
                    <Link
                      to={`post/${post._id}`}
                      className="btn btn-raised btn-info btn-sm text-center"
                    >
                      Read More About This Post
                    </Link>
                  </div>
                </div>

                // <div className="card col-md-12 mb-2" key={i}>
                //   <div className="card-body">
                //     <img
                //       src={`${process.env.REACT_APP_API_URL}/post/photo/${post._id}`}
                //       alt={post.title}
                //       onError={i => i.target.src=`${DefaultPost}`}
                //       className="img-thumbnail mb-3"
                //       style={{height: '200px', width:"300px"}}
                //     />
                //     <h5 className="card-title">{post.title}</h5>
                //     <p className="card-text">{post.body.substring(0, 100)}</p>
                //     <br />
                //     <div class="card-footer text-muted">
                //       <p>
                //         Posted by <Link to={`${posterId}`}>{posterName} </Link>
                //         on {new Date(post.created).toDateString()}
                //       </p>
                //       <Link
                //         to={`post/${post._id}`}
                //         className="btn btn-raised btn-primary btn-sm"
                //       >
                //         Read more
                //       </Link>
                //     </div>
                //   </div>
                // </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  renderGroup = group => {
    const creatorName = group.createdBy ? group.createdBy.name : " Unknown";
    const creatorId = group.createdBy ? group.createdBy._id : " Unknown";
    const { joined, group_posts } = this.state;
    const groupId = group._id;

    return (
      <div className="card-body">
        <img
          src={`${process.env.REACT_APP_API_URL}/group/photo/${groupId}`}
          alt={group.name}
          onError={i => (i.target.src = `${DefaultPost}`)}
          className="img-thumbnail mb-3"
          style={{flex :1 , height: 500, width: 1200, resizeMode: "contain" }}
        />

        <br />
       

        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="mr-auto">
              <Link
                to={`/group/${groupId}/about`}
                className="nav-link text-info"
                color="text-info"
              >
                About
              </Link>
              {/* <Nav.Link href="/group/create">About</Nav.Link> */}
              <Link
                to={`/group/${groupId}/events`}
                className="nav-link text-info"
                color="text-info"
              >
                Events
              </Link>
              <Link
                to={`/group/${groupId}/posts`}
                className="nav-link text-info"
                color="text-info"
              >
                Posts
              </Link>
              <Link
                to={`/group/${groupId}/calendar`}
                className="nav-link text-info"
                color="text-info"
              >
                Calendar
              </Link>
              {/* <Nav.Link className="nav-link text-info" color="text-info" href="/groups">Past Events</Nav.Link> */}
            </Nav>
          </Navbar.Collapse>
        </Navbar>

        {this.renderPosts(group_posts)}
        <br />
        <br />
        {/* {this.renderEvents(group_events)} */}

        <div class="card-footer text-muted">
          {/* <p>
            Group Administrator <Link to={`/user/${creatorId}`}>{creatorName} </Link>
            {/* on {new Date(group.created).toDateString()} */}
          {/* </p>  */}

          {isAuthenticated().user && isAuthenticated().user._id === creatorId && (
            <>
              <Link
                to={`/group/edit/${group._id}`}
                className="btn btn-raised btn-info btn-sm mr-3"
              >
                Edit group
              </Link>

              <button
                onClick={this.deleteConfirmed}
                className="btn btn-raised btn-danger btn-sm mr-3"
              >
                Delete Group
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  render() {
    const {
      group,
      redirectToGroups,
      redirectToSignin,
      members,
      group_events,
      tags,
      joined
    } = this.state;

    const creatorName = group.createdBy ? group.createdBy.name : " Unknown";
    const creatorId = group.createdBy ? group.createdBy._id : " Unknown";
    if (redirectToGroups) {
      return <Redirect to={`/groups`} />;
      //   let userId = isAuthenticated().user._id;
      //   return <Redirect to={`/user/${userId}`} />;
    } else if (redirectToSignin) {
      return <Redirect to={`/signin`} />;
    }

    return (
      <div>
        <Menu />

        <div className="container">
          {" "}
          {/* original */}
          <h2 className="display-2 mt-5 ml-3 text-dark">{group.name}</h2>
          {/* <div><MdLocationOn/><h5 className="ml-3 mt-3">{group.location}</h5></div> */}
          <div class="flex flex--row ml-3 mr-3 flex--alignCenter organizer-row">
            <MdLocationOn />
            <span> {group.location}</span>
          </div>
          <div class="flex flex--row ml-3 flex--alignCenter organizer-row">
            <IoMdPeople />
            <span>
              {" "}
              {members.length} members
              {joined ? (
                <div className="float-right">
                  {/* <span>{members.length} Members </span> */}
                  <button
                    className="btn btn-raised btn-danger btn-sm mr-3"
                    onClick={this.joinToggle}
                  >
                    Exit the group
                  </button>
                </div>
              ) : (
                <div className="float-right ml-0">
                  {/* <span>{members.length} Members </span> */}
                  <button
                    className="btn btn-raised btn-info"
                    onClick={this.joinToggle}
                  >
                    Join the group
                  </button>
                </div>
              )}
            </span>
          </div>
          <div class="flex flex--row ml-3 flex--alignCenter organizer-row">
            <MdPersonOutline />
            <span>
              {" "}
              Created by <Link to={`/user/${creatorId}`}>
                {creatorName}{" "}
              </Link>{" "}
            </span>
          </div>
          <div className="ml-3 mt-3">
            <TiTags />
            {tags.map((tag, i) => {
              return (
                <span
                  key={i}
                  className="badge badge-pill badge-info mr-2 ml-2 display-3"
                >
                  {tag}
                </span>
              );
            })}
          </div>
          {this.renderGroup(group)}
          {/* <Comment
          postId={post._id}
          comments={comments.reverse()}
          updateComments={this.updateComments}
        /> */}
        </div>
      </div>
    );
  }
}

export default GroupPosts;
