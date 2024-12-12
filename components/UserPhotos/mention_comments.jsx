import React, { useState } from "react";
import { MentionsInput, Mention } from 'react-mentions';

function MentionComment() {

    const users = [
        {
          id: "isaac",
          display: "Isaac Newton",
        },
        {
          id: "sam",
          display: "Sam Victor",
        },
        {
          id: "emma",
          display: "emmanuel@nobody.com",
        },
      ];
    const [value, setValue] = useState("");
    
    function handleMentions(e) {
        setValue(e.target.value);
    }

    return (
        <MentionsInput value={value} onChange={handleMentions}>
        <Mention trigger="@" data={users}/>
        </MentionsInput>
    );
}

export default MentionComment;