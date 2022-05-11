import React from 'react';
import classes from "./__name__.module.css";
import classNames from "classnames";

const __name__ = (props) => {
    return (
        <div className={classNames(classes.root, props.className)}>

        </div>
    );
};

export default __name__;