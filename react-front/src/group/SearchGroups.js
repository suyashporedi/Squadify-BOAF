import React, { Component } from "react";
import { isAuthenticated } from "../auth";
import { Redirect, Link } from "react-router-dom";
import DefaultPost from "../images/tea.png";
import { listByTag } from "../group/apiGroup";
import ProfileTabs from "../user/ProfileTabs";
import Menu from "../core/Menu";

class SearchGroups extends Component {
  constructor() {
    super();
    this.state = {
      //   user: "",
      redirectToSignin: false,
      error: "",
      groups: [],
      query: "",
      tag: ""
    };
  }

  queryChange = evt => {
    this.setState({ query: evt.target.value });
    // console.log(this.state.query);
  };

  handleSearch = () => {
    // this.context.router.push(`/groups/search/${this.state.query}`);
    this.props.history.push(`/groups/search/${this.state.query}`);
    window.location.reload();
  };

  componentDidMount() {
    // const userId = this.props.match.params.userId;
    const tag = this.props.match.params.tag.toString();
    listByTag(tag).then(data => {
      if (data.error) {
        this.setState({ redirectToSignin: true });
      } else {
        this.setState({ groups: data, tag: tag });
        //   this.loadPosts(data._id); // pass userId to loadPosts by this user
      }
    });
  }

  //   componentWillReceiveProps(props) {
  //     const userId = props.match.params.userId;
  //     this.init(userId);
  //   }

  renderGroups = groups => {
    return (
      <div className="row">
        {groups.map((group, i) => {
          const creatorId = group.createdBy
            ? `/user/{group.createdBy._id}`
            : "";
          const creatorName = group.createdBy
            ? group.createdBy.name
            : " Unknown";

          return (
            <div className="card col-md-12 mb-2" key={i}>
              <div className="card-body">
                <img
                  src={`${process.env.REACT_APP_API_URL}/group/photo/${group._id}`}
                  alt={group.name}
                  onError={i => (i.target.src = `${DefaultPost}`)}
                  className="img-thumbnail mb-3"
                  style={{ height: "200px", width: "300px" }}
                />
                <h5 className="card-title">{group.name}</h5>
                <p className="card-text">{group.about.substring(0, 100)}</p>
                <br />
                <div class="card-footer text-muted">
                  <p>
                    Created by <Link to={`${creatorId}`}>{creatorName} </Link>
                    on {new Date(group.created).toDateString()}
                  </p>
                  <Link
                    to={`/group/${group._id}`}
                    className="btn btn-raised btn-primary btn-sm"
                  >
                    Read More About This Group
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  render() {
    const { redirectToSignin, groups, tag, query } = this.state;

    if (redirectToSignin) {
      return <Redirect to="/signin" />;
    }

    return (
      <>
        <div>
          <Menu />
          <div className="container mt-5">
            <form> 
              <input
                type="text"
                placeholder="Search for groups..."
                name="search"
                onChange={this.queryChange}
                onSubmit={this.handleSearch}
              />
              <Link to={`/groups/search/${query}`} onClick={this.handleSearch}>
                <i className="fa fa-search ml-1"></i>
              </Link>
            </form>
          </div>
        </div>
        <div className="container fluid">
          <h2 className="mt-5 mb-5">Groups search result for tag "{tag}"</h2>
          {this.renderGroups(groups)}
        </div>
      </>
    );
  }
}

export default SearchGroups;
