export default {
    name: "TableColgroup",
    props: ["columns"],
    render(h) {
        return (
            <colgroup>
                {
                    this.columns.map(column => {
                        console.log(column.width);
                        return (
                            <col style={{width: column.width + "px"}} />
                        );
                    })
                }
            </colgroup>
        );
    }
};
