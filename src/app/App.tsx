import { Suspense } from "react";
import { Action } from "./Action";
import { ActionFn, FormActionFn } from "./ActionFn";
import { Counter } from "./Counter";
import { Sleep } from "./Sleep";

const App = () => {
	const promise = new Promise((resolve, _reject) => setTimeout(resolve, 3000));

	return (
		<div>
			<div>Hello!</div>
			<Suspense fallback="loading...">
				<Counter sleep={promise} />
			</Suspense>
			<Counter />
			<Action action={ActionFn} />
			<Suspense fallback={<div>sleeping...</div>}>
				<Sleep />
			</Suspense>
			<Suspense fallback={<div>sleeping...</div>}>
				<Sleep />
			</Suspense>
			<form action={FormActionFn}>
				<button type="submit">action [form]</button>
			</form>
		</div>
	);
};

export { App };
